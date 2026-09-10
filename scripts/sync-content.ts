/**
 * Imports MDX articles committed to content/articles/ into the database.
 *
 * Files are the input; the database is the runtime store. This runs on every
 * build (and can be run by hand), and is idempotent: an unchanged file is
 * skipped, a changed one updates in place, and an article already approved
 * keeps its published status rather than being knocked back into the queue.
 *
 *   npm run sync:content          import and report
 *   npm run sync:content -- --dry validate only, write nothing
 */

import { PrismaClient } from "@prisma/client";
import {
  listArticleFiles,
  parseArticleFile,
  estimateReadingMinutes,
  ParseFailure,
} from "../lib/content";
import { matchAffiliateTool } from "../lib/affiliate-engine";

const dryRun = process.argv.includes("--dry");
let prisma: PrismaClient | null = null;

function getPrismaClient(): PrismaClient | null {
  if (prisma) return prisma;
  const url = process.env.DATABASE_URL || "";
  if (!url.startsWith("postgres://") && !url.startsWith("postgresql://")) {
    return null;
  }
  try {
    prisma = new PrismaClient();
    return prisma;
  } catch {
    return null;
  }
}

async function main() {
  const files = listArticleFiles();
  const failures: ParseFailure[] = [];
  let created = 0;
  let updated = 0;
  let unchanged = 0;
  const warnings: Array<{ file: string; messages: string[] }> = [];

  if (files.length === 0) {
    console.log("No article files found in content/articles/. Nothing to sync.");
    return;
  }

  // Validation runs FIRST and unconditionally.
  //
  // It used to sit behind the database check, so when the database was
  // unreachable the parse loop never ran and a malformed article passed
  // silently with exit code 0 — losing the safety property exactly during the
  // deploy where something was already wrong. Content correctness has nothing
  // to do with database availability, so it is checked either way.
  const parsed: Array<ReturnType<typeof parseArticleFile>> = files.map(parseArticleFile);

  for (const result of parsed) {
    if (!result.ok) {
      failures.push(result.failure);
    } else if (result.article.seoWarnings.length > 0) {
      warnings.push({
        file: result.article.externalId,
        messages: result.article.seoWarnings.map((w) => `${w.field}: ${w.message}`),
      });
    }
  }

  if (failures.length > 0) {
    reportWarnings(warnings);
    reportFailures(failures);
    // Never write to the database when any file is invalid.
    process.exitCode = 1;
    return;
  }

  const db = !dryRun ? getPrismaClient() : null;
  if (!dryRun && !db) {
    reportWarnings(warnings);
    console.warn("\n⚠️  No valid PostgreSQL DATABASE_URL found. Articles validated but not synced.");
    console.warn("   Set DATABASE_URL to enable syncing. The build's preflight step will");
    console.warn("   stop the deploy if the database is genuinely required.\n");
    return;
  }

  for (const result of parsed) {
    if (!result.ok) continue; // already reported above
    const a = result.article;

    if (dryRun) {
      console.log(`  valid: ${a.externalId}`);
      created += 1;
      continue;
    }

    const existing = await db!.article.findUnique({
      where: { externalId: a.externalId },
      select: { id: true, sourceHash: true, status: true, publishedAt: true },
    });

    if (existing?.sourceHash === a.sourceHash) {
      unchanged += 1;
      continue;
    }

    // Only ever links to a tool already in the registry; never creates one.
    const tool = a.toolName ? await matchAffiliateTool(a.toolName) : null;

    const data = {
      title: a.title,
      summary: a.summary,
      category: a.category,
      verdict: a.verdict,
      jargonBuster: JSON.stringify(a.jargonBuster),
      useCases: JSON.stringify(a.useCases),
      type: a.type,
      keyPoints: a.keyPoints.length ? JSON.stringify(a.keyPoints) : null,
      body: a.body || null,
      readingMinutes: estimateReadingMinutes(a),
      sourceAuthor: a.sourceName,
      sourceUrl: a.sourceUrl,
      heroImage: a.heroImage || null,
      heroImageAlt: a.heroImageAlt || null,
      heroImageCredit: a.heroImageCredit || null,
      seoTitle: a.seoTitle,
      metaDescription: a.metaDescription,
      keywords: a.keywords.length ? JSON.stringify(a.keywords) : null,
      sourcePublishedAt: a.sourcePublishedAt ?? null,
      retrievedAt: a.retrievedAt ?? null,
      primaryToolId: tool?.toolId ?? null,
      origin: "MDX",
      sourceHash: a.sourceHash,
    };

    if (existing) {
      // Editing a live article updates it in place; it does not un-publish.
      await db!.article.update({ where: { id: existing.id }, data });
      updated += 1;
    } else {
      await db!.article.create({
        data: {
          ...data,
          externalId: a.externalId,
          slug: await uniqueSlug(db!, a.slug),
          // New imports always land in the review queue.
          status: "DRAFT",
          isPublished: false,
          publishedAt: null,
        },
      });
      created += 1;
    }
  }

  console.log(
    `\nSynced content: ${created} created, ${updated} updated, ${unchanged} unchanged, ${failures.length} rejected.`
  );

  reportWarnings(warnings);
}

/** SEO advice that is worth fixing but must not block a deploy. */
function reportWarnings(warnings: Array<{ file: string; messages: string[] }>) {
  if (warnings.length === 0) return;
  console.warn("\nSEO warnings (not blocking, but worth fixing):");
  for (const w of warnings) {
    console.warn(`\n  ${w.file}`);
    w.messages.forEach((m) => console.warn(`    - ${m}`));
  }
}

/** Content errors. These always fail the build, whatever the database is doing. */
function reportFailures(failures: ParseFailure[]) {
  console.error("\nRejected files:");
  for (const f of failures) {
    console.error(`\n  ${f.file}`);
    f.errors.forEach((e) => console.error(`    - ${e}`));
  }
  console.error("");
}

async function uniqueSlug(db: PrismaClient, base: string): Promise<string> {
  let candidate = base || "untitled";
  for (let n = 2; n < 50; n++) {
    const clash = await db.article.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!clash) return candidate;
    candidate = `${base}-${n}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

main()
  .catch((e: any) => {
    if (
      e?.code === "P2021" ||
      e?.message?.includes("does not exist") ||
      e?.message?.includes("Can't reach database server")
    ) {
      console.warn("\n⚠️  Database tables not yet initialized. Skipping article sync during build.");
      console.warn("   Run 'npx prisma db push' once your Neon database is connected.\n");
      process.exitCode = 0;
      return;
    }
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma?.$disconnect());

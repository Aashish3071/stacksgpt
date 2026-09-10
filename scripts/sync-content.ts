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

const prisma = new PrismaClient();
const dryRun = process.argv.includes("--dry");

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

  for (const file of files) {
    const result = parseArticleFile(file);

    if (!result.ok) {
      failures.push(result.failure);
      continue;
    }

    const a = result.article;

    if (a.seoWarnings.length > 0) {
      warnings.push({
        file: a.externalId,
        messages: a.seoWarnings.map((w) => `${w.field}: ${w.message}`),
      });
    }

    const existing = await prisma.article.findUnique({
      where: { externalId: a.externalId },
      select: { id: true, sourceHash: true, status: true, publishedAt: true },
    });

    if (existing?.sourceHash === a.sourceHash) {
      unchanged += 1;
      continue;
    }

    if (dryRun) {
      console.log(`  would ${existing ? "update" : "create"}: ${a.externalId}`);
      existing ? (updated += 1) : (created += 1);
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
      await prisma.article.update({ where: { id: existing.id }, data });
      updated += 1;
    } else {
      await prisma.article.create({
        data: {
          ...data,
          externalId: a.externalId,
          slug: await uniqueSlug(a.slug),
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

  if (warnings.length > 0) {
    console.warn("\nSEO warnings (not blocking, but worth fixing):");
    for (const w of warnings) {
      console.warn(`\n  ${w.file}`);
      w.messages.forEach((m) => console.warn(`    - ${m}`));
    }
  }

  if (failures.length > 0) {
    console.error("\nRejected files:");
    for (const f of failures) {
      console.error(`\n  ${f.file}`);
      f.errors.forEach((e) => console.error(`    - ${e}`));
    }
    // Fail the build so a malformed article is caught in CI, not in production.
    process.exitCode = 1;
  }
}

async function uniqueSlug(base: string): Promise<string> {
  let candidate = base || "untitled";
  for (let n = 2; n < 50; n++) {
    const clash = await prisma.article.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!clash) return candidate;
    candidate = `${base}-${n}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

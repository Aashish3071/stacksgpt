/**
 * Build preflight.
 *
 * Runs before `next build` and refuses to continue when the deployment would
 * produce a broken or empty site. The failure modes this exists to prevent:
 *
 *   - no DATABASE_URL           -> every page renders empty, sitemap has no
 *                                  articles, and the deploy silently replaces a
 *                                  working site with an empty one
 *   - database unreachable      -> same outcome
 *   - tables not yet created    -> tolerated once, because a brand new database
 *                                  legitimately needs `prisma db push` first
 *
 * Failing here is the point: a failed build leaves the previous good deployment
 * serving, which is always better than publishing an empty news site.
 */

import { PrismaClient } from "@prisma/client";

const ALLOW_EMPTY = process.env.ALLOW_EMPTY_BUILD === "true";

function fail(title: string, lines: string[]): never {
  console.error(`\n✖ Build stopped: ${title}\n`);
  lines.forEach((l) => console.error(`  ${l}`));
  console.error("");
  process.exit(1);
}

async function main() {
  const url = process.env.DATABASE_URL || "";

  if (!url.startsWith("postgres://") && !url.startsWith("postgresql://")) {
    fail("DATABASE_URL is missing or not a Postgres URL", [
      "The site reads every article from the database, so building without one",
      "would deploy a site with no articles and an empty sitemap.",
      "",
      "Set DATABASE_URL in your Vercel project settings (Settings > Environment",
      "Variables), for all environments you deploy.",
    ]);
  }

  const prisma = new PrismaClient();

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    // Prisma's message starts with a blank line; take the first line with text.
    const detail =
      String(err instanceof Error ? err.message : err)
        .split("\n")
        .map((l) => l.trim())
        .find((l) => l.length > 0) || "no further detail";

    fail("cannot connect to the database", [
      detail,
      "",
      "Check that DATABASE_URL is correct and that the database allows",
      "connections from Vercel's build environment.",
    ]);
  }

  let publishedCount: number;
  try {
    publishedCount = await prisma.article.count({ where: { isPublished: true } });
  } catch {
    // Tables absent: a new database that has not been migrated yet. Allowed,
    // because the very first deploy has to happen before `prisma db push` can run.
    console.warn(
      "\n⚠️  Connected, but the tables do not exist yet.\n" +
        "   Run `npx prisma db push` against this database, then redeploy.\n"
    );
    await prisma.$disconnect();
    return;
  }

  if (publishedCount === 0 && !ALLOW_EMPTY) {
    fail("the database has no published articles", [
      "Deploying now would replace the live site with an empty one and hand",
      "search engines a sitemap containing no articles.",
      "",
      "Approve at least one article in /admin, or set ALLOW_EMPTY_BUILD=true",
      "if you genuinely intend to deploy an empty site (a first launch, say).",
    ]);
  }

  const pooled = /pgbouncer=true/.test(url) || /:6543\//.test(url) || /pooler\./.test(url);
  if (process.env.VERCEL && !pooled) {
    console.warn(
      "\n⚠️  DATABASE_URL is not a pooled connection.\n" +
        "   Serverless opens a connection per invocation and will exhaust the\n" +
        "   direct endpoint's limit. Use the transaction pooler (port 6543) for\n" +
        "   DATABASE_URL and keep the direct endpoint for DIRECT_URL.\n"
    );
  }

  console.log(`✓ Preflight passed — ${publishedCount} published article(s).`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Preflight crashed:", err);
  process.exit(1);
});

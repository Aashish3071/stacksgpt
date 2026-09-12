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

import prisma from "../lib/db";
import { verifyHeroImage } from "../lib/media-validation";

const ALLOW_EMPTY = process.env.ALLOW_EMPTY_BUILD === "true";

function fail(title: string, lines: string[]): never {
  console.error(`\n✖ Build stopped: ${title}\n`);
  lines.forEach((l) => console.error(`  ${l}`));
  console.error("");
  process.exit(1);
}

/**
 * Every canonical tag, sitemap entry, RSS link and JSON-LD url is built from
 * NEXT_PUBLIC_SITE_URL. If it is wrong the site still builds and still looks
 * fine, while quietly telling Google that the authoritative copy lives
 * somewhere else — which is why this is checked rather than left to be noticed
 * months later in Search Console.
 */
function checkSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "";

  // localhost is correct for a local build, so only a real deploy is held to
  // the public-domain requirement.
  const deploying = !!process.env.VERCEL || !!process.env.CI;
  if (!deploying) return;

  if (!raw || /^https?:\/\/localhost(:\d+)?\/?$/i.test(raw)) {
    fail("NEXT_PUBLIC_SITE_URL is missing or points at localhost", [
      `Current value: ${raw || "(unset)"}`,
      "",
      "Canonical tags, the sitemap, the RSS feed and all structured data are",
      "derived from this value. Deploying without it publishes a site that",
      "points search engines at localhost.",
      "",
      "Set NEXT_PUBLIC_SITE_URL to the public domain, e.g.",
      "  https://www.example.com",
    ]);
  }

  let host: string;
  try {
    host = new URL(raw).host.toLowerCase();
  } catch {
    fail("NEXT_PUBLIC_SITE_URL is not a valid URL", [`Current value: ${raw}`]);
  }

  // This was a warning, not a failure, and that is exactly why it shipped:
  // NEXT_PUBLIC_SITE_URL was set to a *.vercel.app value in production for an
  // unknown stretch of time, and every canonical tag, sitemap entry and feed
  // link pointed at the preview domain instead of the real one the whole
  // time. A build that "still works" is not good enough here — fail it.
  if (host.endsWith(".vercel.app")) {
    fail(`NEXT_PUBLIC_SITE_URL is a *.vercel.app domain (${host})`, [
      "Canonical tags, the sitemap and the RSS feed would all point at the",
      "preview domain, so search engines credit it instead of your real site.",
      "This exact mistake has shipped to production before.",
      "",
      "Set NEXT_PUBLIC_SITE_URL to your real custom domain, e.g.",
      "  https://www.example.com",
    ]);
  }
}

/**
 * Every RSS/YouTube channel fetch is rejected unless its hostname is
 * explicitly listed here (see lib/security.ts validateFeedUrl) — a deliberate
 * SSRF guard, not a bug. But an empty allowlist fails *silently*: channels
 * stay "active," the cron runs and reports success, and nothing ever lands in
 * RawNews. That is exactly what happened here — 9 active channels ran for an
 * unknown stretch of time producing zero rows, and nothing surfaced it short
 * of querying the database directly. This turns it into a build-time signal
 * instead. A warning, not a failure: running with ingestion disabled is a
 * legitimate choice, silently broken ingestion is not.
 */
async function checkRssAllowedHosts() {
  if (process.env.RSS_ALLOWED_HOSTS?.trim()) return;
  let activeChannels = 0;
  try {
    activeChannels = await prisma.channel.count({ where: { isActive: true } });
  } catch {
    return; // Tables may not exist yet; the DB check right after this handles that.
  }
  if (activeChannels > 0) {
    console.warn(
      `\n⚠️  RSS_ALLOWED_HOSTS is empty, but ${activeChannels} channel(s) are active.\n` +
        "   Every fetch will be silently rejected and RawNews will stay empty\n" +
        "   forever, with no error surfaced anywhere but the function logs.\n" +
        "   Set RSS_ALLOWED_HOSTS to a comma-separated list of each channel's\n" +
        "   feed hostname (check each Channel.handleOrUrl).\n",
    );
  }
}

async function main() {
  checkSiteUrl();
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

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    try {
      await prisma.article.count();
    } catch {
      const allLines = String(
        err instanceof Error ? err.stack || err.message : err,
      )
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      fail("cannot connect to the database", [
        ...allLines.slice(0, 5),
        "",
        "Check that DATABASE_URL is correct and that the database allows",
        "connections from Vercel's build environment.",
      ]);
    }
  }

  let publishedCount: number;
  try {
    publishedCount = await prisma.article.count({
      where: { isPublished: true },
    });
  } catch {
    // Tables absent: a new database that has not been migrated yet. Allowed,
    // because the very first deploy has to happen before `prisma db push` can run.
    console.warn(
      "\n⚠️  Connected, but the tables do not exist yet.\n" +
        "   Run `npx prisma db push` against this database, then redeploy.\n",
    );
    await prisma.$disconnect();
    return;
  }

  if (publishedCount === 0) {
    console.log(
      "ℹ️  Notice: The database currently has 0 published articles. Site will deploy with empty-state ready for new publishing.",
    );
  }

  await checkRssAllowedHosts();

  const liveImages = await prisma.article.findMany({
    where: { isPublished: true, heroImage: { not: null } },
    distinct: ["heroImage"],
    select: {
      heroImage: true,
      heroImageAlt: true,
      heroImageCredit: true,
      heroImageOrigin: true,
    },
  });
  for (const a of liveImages) {
    const image = await verifyHeroImage(a.heroImage!, { localRequired: true });
    const known = await prisma.mediaAsset.findUnique({
      where: { url: a.heroImage! },
    });
    if (known?.contentHash && known.contentHash !== image.contentHash)
      throw Error(
        "A published image was overwritten. Restore it and use a new filename for the revision.",
      );
    if (!known)
      await prisma.mediaAsset.create({
        data: {
          url: a.heroImage!,
          alt: a.heroImageAlt || "",
          credit: a.heroImageCredit || "",
          origin: a.heroImageOrigin,
          createdBy: "migration",
          ...image,
        },
      });
  }
  const pooled =
    /pgbouncer=true/.test(url) || /:6543\//.test(url) || /pooler\./.test(url);
  if (process.env.VERCEL && !pooled) {
    console.warn(
      "\n⚠️  DATABASE_URL is not a pooled connection.\n" +
        "   Serverless opens a connection per invocation and will exhaust the\n" +
        "   direct endpoint's limit. Use the transaction pooler (port 6543) for\n" +
        "   DATABASE_URL and keep the direct endpoint for DIRECT_URL.\n",
    );
  }

  console.log(`✓ Preflight passed: ${publishedCount} published article(s).`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Preflight crashed:", err);
  process.exit(1);
});

/**
 * Posting articles to X and LinkedIn on official platform APIs only — no
 * browser automation, which would risk suspension of the real account under
 * both platforms' terms and doesn't fit this app's serverless architecture
 * (no persistent browser session).
 *
 * Follows the shape already established in lib/newsletter.ts: a boolean
 * *Enabled() gate on required env vars, a client built lazily only inside the
 * send function (never at module load, so a missing var can't crash import),
 * explicit timeouts, and a deliver*() batch function meant to be called from
 * a cron route guarded by requireSecret(req, "CRON_SECRET").
 *
 * A post is drafted automatically the first time its article is published
 * (see the "publish" branch in lib/editorial.ts::transitionArticle), but
 * never sent automatically — deliverApprovedSocialPosts() only ever sends
 * rows a human has already flipped to APPROVED in the newsroom queue. This
 * mirrors the article review-queue philosophy already in this codebase.
 */
import { TwitterApi } from "twitter-api-v2";
import prisma from "./db";
import { siteUrl } from "./site";

export type SocialPlatform = "X" | "LINKEDIN";

export function xEnabled() {
  return !!(
    process.env.X_API_KEY &&
    process.env.X_API_SECRET &&
    process.env.X_ACCESS_TOKEN &&
    process.env.X_ACCESS_SECRET
  );
}

export function linkedinEnabled() {
  return !!(process.env.LINKEDIN_ACCESS_TOKEN && process.env.LINKEDIN_ORG_URN);
}

function truncate(value: string, max: number) {
  if (value.length <= max) return value;
  return value.slice(0, Math.max(0, max - 1)).trimEnd() + "…";
}

/**
 * X counts any URL as exactly 23 characters via t.co, regardless of its real
 * length, and the practical limit for a post carrying a link is effectively
 * a little under 280 once the link and a trailing space are reserved.
 */
const X_LINK_RESERVED = 24; // 23 for the t.co-shortened link + 1 leading space
const X_MAX = 280;

function buildBody(
  article: { title: string; summary: string; slug: string },
  platform: SocialPlatform,
): string {
  const url = siteUrl(`/article/${article.slug}`);
  if (platform === "X") {
    const budget = X_MAX - X_LINK_RESERVED;
    return `${truncate(article.title, budget)}\n${url}`;
  }
  // LinkedIn allows far more room; lead with the headline, then the takeaway.
  return `${article.title}\n\n${truncate(article.summary, 600)}\n\n${url}`;
}

/**
 * Creates a PENDING_APPROVAL draft for one platform from a just-published
 * article. Accepts a Prisma client or an in-flight transaction client so it
 * can run inside the same transaction as the publish itself (see
 * lib/editorial.ts) — this only ever writes one row, no network calls, so
 * it's safe to do without leaving the transaction open for I/O.
 */
export async function draftSocialPost(
  db: any,
  article: {
    id: string;
    title: string;
    summary: string;
    slug: string;
    heroImage?: string | null;
  },
  platform: SocialPlatform,
) {
  return db.socialPost.create({
    data: {
      articleId: article.id,
      platform,
      body: buildBody(article, platform),
      imageUrl: article.heroImage || null,
    },
  });
}

export async function sendXPost(post: {
  id: string;
  body: string;
  imageUrl?: string | null;
}) {
  if (!xEnabled()) throw Error("X posting is not configured.");
  const client = new TwitterApi({
    appKey: process.env.X_API_KEY!,
    appSecret: process.env.X_API_SECRET!,
    accessToken: process.env.X_ACCESS_TOKEN!,
    accessSecret: process.env.X_ACCESS_SECRET!,
  });
  // Image upload intentionally left out of the first version: it needs the
  // image fetched, re-uploaded via v1.1 media endpoints, and attached before
  // the tweet call, which is meaningfully more surface area to get right.
  // Text-plus-link posts first; image support is a clean follow-up once this
  // is proven working end to end.
  const result = await client.v2.tweet(post.body);
  return { externalId: result.data.id };
}

export async function sendLinkedInPost(post: {
  id: string;
  body: string;
  imageUrl?: string | null;
}) {
  if (!linkedinEnabled()) throw Error("LinkedIn posting is not configured.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch("https://api.linkedin.com/rest/posts", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
        "LinkedIn-Version": "202401",
      },
      body: JSON.stringify({
        author: process.env.LINKEDIN_ORG_URN,
        commentary: post.body,
        visibility: "PUBLIC",
        distribution: {
          feedDistribution: "MAIN_FEED",
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw Error(
        `LinkedIn rejected the post (${res.status}): ${detail.slice(0, 300)}`,
      );
    }
    // LinkedIn's rest.li APIs return the created entity's URN in this header
    // rather than a JSON body on success.
    const externalId = res.headers.get("x-restli-id") || null;
    return { externalId };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Sends every SocialPost a human has approved. Never touches PENDING_APPROVAL
 * rows — approval is a one-way human action taken in the newsroom queue.
 * Mirrors lib/newsletter.ts::deliverNewsletterBatch()'s claim-then-send shape
 * so two overlapping cron invocations can't double-send the same post.
 */
export async function deliverApprovedSocialPosts() {
  const rows = await prisma.socialPost.findMany({
    where: { status: "APPROVED" },
    take: 5,
    orderBy: { approvedAt: "asc" },
  });
  const results: { id: string; ok: boolean; error?: string }[] = [];
  const started = Date.now();
  for (const row of rows) {
    if (Date.now() - started > 20000) break;
    const claimed = await prisma.socialPost.updateMany({
      where: { id: row.id, status: "APPROVED" },
      data: { status: "SENDING" },
    });
    if (!claimed.count) continue; // another invocation already claimed it
    try {
      const { externalId } =
        row.platform === "X"
          ? await sendXPost(row)
          : await sendLinkedInPost(row);
      await prisma.socialPost.update({
        where: { id: row.id },
        data: { status: "SENT", sentAt: new Date(), externalId },
      });
      results.push({ id: row.id, ok: true });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Send failed";
      await prisma.socialPost.update({
        where: { id: row.id },
        data: { status: "FAILED", error: message },
      });
      results.push({ id: row.id, ok: false, error: message });
    }
  }
  return results;
}

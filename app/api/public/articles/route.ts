import prisma from "@/lib/db";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * Read-only list of published articles, for whatever writes the social copy.
 *
 * No auth: this exposes nothing the public article pages and the RSS feed do
 * not already publish. It exists because an agent parsing JSON is far more
 * reliable than the same agent scraping rendered HTML.
 *
 * ?needsSocial=true returns only articles with no social post yet for a given
 * platform, which is the "what still needs writing?" queue.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const needsSocial = url.searchParams.get("needsSocial") === "true";
  const platform = url.searchParams.get("platform");
  const limit = Math.min(
    50,
    Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10) || 20),
  );

  if (platform && platform !== "X" && platform !== "LINKEDIN")
    return Response.json(
      { error: 'platform must be "X" or "LINKEDIN".' },
      { status: 400 },
    );

  try {
    const articles = await prisma.article.findMany({
      where: {
        isPublished: true,
        ...(needsSocial
          ? {
              socialPosts: {
                none: platform ? { platform } : {},
              },
            }
          : {}),
      },
      orderBy: { publishedAt: { sort: "desc", nulls: "last" } },
      take: limit,
      select: {
        slug: true,
        title: true,
        summary: true,
        category: true,
        publishedAt: true,
      },
    });

    return Response.json({
      articles: articles.map((a) => ({
        ...a,
        url: siteUrl(`/article/${a.slug}`),
      })),
    });
  } catch {
    // The socialPosts relation is unavailable until the SocialPost migration
    // is applied; say so plainly rather than returning a misleading empty list.
    return Response.json(
      { error: "Could not read articles. Has the database been migrated?" },
      { status: 503 },
    );
  }
}

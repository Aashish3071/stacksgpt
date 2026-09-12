import prisma from "@/lib/db";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * One published article as JSON, for whatever writes the social copy.
 *
 * Returns the same fields the public article page renders — nothing private,
 * no drafts, no pending edits. `keyPoints` is stored as a JSON string in the
 * database; it is parsed here so the caller gets an array rather than having
 * to know that.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  try {
    const article = await prisma.article.findFirst({
      where: { slug, isPublished: true },
      select: {
        slug: true,
        title: true,
        summary: true,
        body: true,
        verdict: true,
        keyPoints: true,
        category: true,
        type: true,
        tags: true,
        publishedAt: true,
        sourceAuthor: true,
        sourceUrl: true,
        heroImage: true,
        heroImageAlt: true,
        metaDescription: true,
      },
    });

    if (!article)
      return Response.json(
        { error: `No published article with slug "${slug}".` },
        { status: 404 },
      );

    let keyPoints: string[] = [];
    try {
      const parsed = JSON.parse(article.keyPoints || "[]");
      if (Array.isArray(parsed)) keyPoints = parsed;
    } catch {
      // A malformed keyPoints value should not take the whole response down.
    }

    return Response.json({
      ...article,
      keyPoints,
      url: siteUrl(`/article/${article.slug}`),
      heroImageUrl: article.heroImage
        ? article.heroImage.startsWith("http")
          ? article.heroImage
          : siteUrl(article.heroImage)
        : null,
    });
  } catch {
    return Response.json({ error: "Could not read that article." }, { status: 503 });
  }
}

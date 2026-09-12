import prisma from "@/lib/db";
import { siteUrl, CATEGORIES } from "@/lib/site";
import { xml } from "@/lib/xml";

export const revalidate = 300;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ page: string }> },
) {
  const value = (await params).page;
  if (!/^\d+\.xml$/.test(value))
    return new Response("Not found", { status: 404 });
  const page = parseInt(value);
  if (page > 1000) return new Response("Not found", { status: 404 });

  let entries: { url: string; date?: Date | null }[] = [];

  if (page === 0) {
    entries = [
      "",
      "/latest",
      "/archive",
      "/tools",
      "/about",
      "/editorial-standards",
      "/methodology",
      "/corrections",
      "/privacy",
      "/contact",
      "/terms",
      "/partners",
    ].map((url) => ({ url: siteUrl(url) }));

    for (const c of CATEGORIES) {
      entries.push({ url: siteUrl(`/category/${c.toLowerCase()}`) });
    }

    try {
      const articles = await prisma.article.findMany({
        where: { isPublished: true },
        select: { tags: true, audiences: true, sourceAuthor: true },
      });

      const activeTags = new Set<string>();
      const activeAudiences = new Set<string>();
      const activeSources = new Set<string>();

      for (const a of articles) {
        if (Array.isArray(a.tags)) a.tags.forEach((t) => activeTags.add(t));
        if (Array.isArray(a.audiences)) a.audiences.forEach((aud) => activeAudiences.add(aud));
        if (a.sourceAuthor) {
          const s = a.sourceAuthor.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
          if (s) activeSources.add(s);
        }
      }

      for (const t of activeTags) entries.push({ url: siteUrl(`/tag/${t}`) });
      for (const a of activeAudiences) entries.push({ url: siteUrl(`/audience/${a}`) });
      for (const s of activeSources) entries.push({ url: siteUrl(`/source/${s}`) });
    } catch (err) {
      console.warn("Could not query taxonomy for sitemaps page:", err);
    }
  } else {
    try {
      const articles = await prisma.article.findMany({
        where: { isPublished: true },
        select: { slug: true, publishedAt: true, publishedUpdatedAt: true },
        orderBy: { id: "asc" },
        skip: (page - 1) * 5000,
        take: 5000,
      });
      if (!articles.length) return new Response("Not found", { status: 404 });
      entries = articles.map((a) => ({
        url: siteUrl(`/article/${a.slug}`),
        date: a.publishedUpdatedAt || a.publishedAt,
      }));
    } catch (err) {
      console.warn("Could not query articles for sitemap page:", err);
      return new Response("Not found", { status: 404 });
    }
  }

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries
      .map(
        (e) =>
          `<url><loc>${xml(e.url)}</loc>${e.date ? `<lastmod>${e.date.toISOString()}</lastmod>` : ""}</url>`,
      )
      .join("")}</urlset>`,
    {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=300",
      },
    },
  );
}

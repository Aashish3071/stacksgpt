import prisma from "@/lib/db";
import { siteUrl } from "@/lib/site";
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
  if (page > 100000) return new Response("Not found", { status: 404 });
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
    const tax = await prisma.taxonomy.findMany({ where: { active: true } });
    for (const t of tax) {
      const kind = (
        {
          CATEGORY: "category",
          TAG: "tag",
          AUDIENCE: "audience",
          SOURCE: "source",
        } as any
      )[t.kind];
      if (!kind) continue;
      const where: any = { isPublished: true };
      if (t.kind === "CATEGORY") where.category = t.name;
      else if (t.kind === "TAG") where.tags = { has: t.slug };
      else if (t.kind === "AUDIENCE") where.audiences = { has: t.slug };
      else where.sourceAuthor = t.name;
      if (await prisma.article.count({ where }))
        entries.push({ url: siteUrl(`/${kind}/${t.slug}`) });
    }
  } else {
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
  }
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.map((e) => `<url><loc>${xml(e.url)}</loc>${e.date ? `<lastmod>${e.date.toISOString()}</lastmod>` : ""}</url>`).join("")}</urlset>`,
    {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=300",
      },
    },
  );
}

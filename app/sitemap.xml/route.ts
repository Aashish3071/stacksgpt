import prisma from "@/lib/db";
import { siteUrl, CATEGORIES } from "@/lib/site";
import { xml } from "@/lib/xml";

export const revalidate = 300;

export async function GET() {
  let articles: any[] = [];
  try {
    articles = await prisma.article.findMany({
      where: { isPublished: true },
      select: {
        slug: true,
        title: true,
        category: true,
        tags: true,
        audiences: true,
        sourceAuthor: true,
        heroImage: true,
        heroImageAlt: true,
        publishedAt: true,
        publishedUpdatedAt: true,
      },
      orderBy: { publishedAt: "desc" },
    });
  } catch (err) {
    console.warn("Could not query articles for sitemap.xml:", err);
  }

  const staticPages = [
    { path: "", priority: "1.0", changefreq: "daily" },
    { path: "/latest", priority: "0.8", changefreq: "daily" },
    { path: "/archive", priority: "0.7", changefreq: "daily" },
    { path: "/tools", priority: "0.7", changefreq: "weekly" },
    { path: "/about", priority: "0.5", changefreq: "monthly" },
    { path: "/editorial-standards", priority: "0.5", changefreq: "monthly" },
    { path: "/methodology", priority: "0.5", changefreq: "monthly" },
    { path: "/corrections", priority: "0.4", changefreq: "monthly" },
    { path: "/privacy", priority: "0.3", changefreq: "yearly" },
    { path: "/terms", priority: "0.3", changefreq: "yearly" },
    { path: "/contact", priority: "0.4", changefreq: "yearly" },
    { path: "/partners", priority: "0.4", changefreq: "monthly" },
  ];

  const staticEntries = staticPages
    .map(
      (p) => `  <url>
    <loc>${xml(siteUrl(p.path))}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`,
    )
    .join("\n");

  const categoryEntries = CATEGORIES.map((c) => {
    const slug = c.toLowerCase();
    return `  <url>
    <loc>${xml(siteUrl(`/category/${slug}`))}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
  }).join("\n");

  const articleEntries = articles
    .map((a) => {
      const date = a.publishedUpdatedAt || a.publishedAt;
      const lastmod = date ? `<lastmod>${date.toISOString()}</lastmod>` : "";
      const imgUrl = a.heroImage
        ? a.heroImage.startsWith("https://")
          ? a.heroImage
          : siteUrl(a.heroImage)
        : null;
      const imageXml = imgUrl
        ? `\n    <image:image>
      <image:loc>${xml(imgUrl)}</image:loc>
      <image:title>${xml(a.heroImageAlt || a.title)}</image:title>
    </image:image>`
        : "";

      return `  <url>
    <loc>${xml(siteUrl(`/article/${a.slug}`))}</loc>${lastmod ? `\n    ${lastmod}` : ""}
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>${imageXml}
  </url>`;
    })
    .join("\n");

  const activeTags = new Set<string>();
  const activeSources = new Set<string>();

  for (const a of articles) {
    if (Array.isArray(a.tags)) {
      for (const t of a.tags) {
        if (t && typeof t === "string") activeTags.add(t);
      }
    }
    if (a.sourceAuthor) {
      const srcSlug = a.sourceAuthor
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      if (srcSlug) activeSources.add(srcSlug);
    }
  }

  const tagEntries = Array.from(activeTags)
    .sort()
    .map(
      (t) => `  <url>
    <loc>${xml(siteUrl(`/tag/${t}`))}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`,
    )
    .join("\n");

  const sourceEntries = Array.from(activeSources)
    .sort()
    .map(
      (s) => `  <url>
    <loc>${xml(siteUrl(`/source/${s}`))}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`,
    )
    .join("\n");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${staticEntries}
${categoryEntries}
${articleEntries}
${tagEntries}
${sourceEntries}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}

import prisma from "@/lib/db";
import { SITE_NAME, SITE_TAGLINE, siteUrl } from "@/lib/site";
import { xml } from "@/lib/xml";

export const revalidate = 900;

export async function GET() {
  let articles: any[] = [];
  try {
    articles = await prisma.article.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: { sort: "desc", nulls: "last" } },
      take: 50,
      select: {
        slug: true,
        title: true,
        summary: true,
        category: true,
        heroImage: true,
        sourceAuthor: true,
        publishedAt: true,
        createdAt: true,
      },
    });
  } catch (err) {
    console.warn("Could not load articles for feed.xml during build:", err);
  }

  const items = articles
    .map((a) => {
      const url = siteUrl(`/article/${a.slug}`);
      const date = (a.publishedAt ?? a.createdAt).toUTCString();
      const imgUrl = a.heroImage
        ? a.heroImage.startsWith("https://")
          ? a.heroImage
          : siteUrl(a.heroImage)
        : null;
      const enclosure = imgUrl
        ? `\n      <enclosure url="${xml(imgUrl)}" length="0" type="image/png" />`
        : "";

      return `    <item>
      <title>${xml(a.title)}</title>
      <link>${xml(url)}</link>
      <guid isPermaLink="true">${xml(url)}</guid>
      <description>${xml(a.summary)}</description>
      <category>${xml(a.category)}</category>${enclosure}
      <pubDate>${date}</pubDate>
    </item>`;
    })
    .join("\n");

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xml(SITE_NAME)}</title>
    <link>${xml(siteUrl())}</link>
    <description>${xml(SITE_TAGLINE)}</description>
    <language>en-us</language>
    <atom:link href="${xml(siteUrl("/feed.xml"))}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(feed, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=900, s-maxage=900",
    },
  });
}

import prisma from "@/lib/db";
import { SITE_NAME, SITE_TAGLINE, siteUrl } from "@/lib/site";

export const revalidate = 900;

export async function GET() {
  let articles: any[] = [];
  try {
    articles = await prisma.article.findMany({
      where: { isPublished: true },
      select: {
        slug: true,
        title: true,
        summary: true,
        category: true,
      },
      orderBy: { publishedAt: "desc" },
      take: 40,
    });
  } catch (err) {
    console.warn("Could not load articles for llms.txt:", err);
  }

  const articleLinks = articles
    .map(
      (a) =>
        `- [${a.title}](${siteUrl(`/article/${a.slug}`)}): ${a.summary.replace(/\n+/g, " ")} (${a.category})`,
    )
    .join("\n");

  const content = `# ${SITE_NAME}
> ${SITE_TAGLINE}

High-signal AI and technology reporting for builders, engineering leaders, and technical decision-makers. Grounded analysis of frontier models, developer APIs, open weights, and enterprise tools without vendor hype.

## Core Navigation
- [Home](${siteUrl()})
- [Latest Stories](${siteUrl("/latest")})
- [The Archive](${siteUrl("/archive")})
- [Editorial Standards](${siteUrl("/editorial-standards")})
- [Methodology](${siteUrl("/methodology")})
- [Corrections Policy](${siteUrl("/corrections")})
- [RSS Feed](${siteUrl("/feed.xml")})
- [XML Sitemap](${siteUrl("/sitemap.xml")})

## Recent Intelligence Dispatches & Model Breakdowns
${articleLinks}

## Attribution
Cite permanent article URLs when referencing reporting. Differentiate reported news from primary vendor documentation.
`;

  return new Response(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

import prisma from "@/lib/db";
import { siteUrl } from "@/lib/site";
import { xml } from "@/lib/xml";
export const revalidate = 300;
export async function GET() {
  const count = await prisma.article.count({ where: { isPublished: true } });
  const urls = Array.from(
    { length: Math.ceil(count / 5000) + 1 },
    (_, i) =>
      `<sitemap><loc>${xml(siteUrl(`/sitemaps/${i}.xml`))}</loc></sitemap>`,
  ).join("");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</sitemapindex>`,
    {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=300",
      },
    },
  );
}

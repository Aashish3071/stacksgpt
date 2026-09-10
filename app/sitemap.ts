import type { MetadataRoute } from "next";
import prisma from "@/lib/db";
import { CATEGORIES, siteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await prisma.article.findMany({
    where: { isPublished: true },
    select: { slug: true, publishedAt: true, createdAt: true },
    orderBy: { publishedAt: "desc" },
    take: 5000,
  });

  const staticPages = ["", "/tools", "/about", "/editorial-standards", "/privacy", "/contact"];

  return [
    ...staticPages.map((path) => ({
      url: siteUrl(path),
      lastModified: new Date(),
      changeFrequency: (path === "" ? "daily" : "monthly") as "daily" | "monthly",
      priority: path === "" ? 1 : 0.5,
    })),
    ...CATEGORIES.map((c) => ({
      url: siteUrl(`/category/${c.toLowerCase()}`),
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
    ...articles.map((a) => ({
      url: siteUrl(`/article/${a.slug}`),
      lastModified: a.publishedAt ?? a.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}

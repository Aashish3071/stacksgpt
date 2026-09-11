import prisma from "./db";
import { Prisma } from "@prisma/client";
import { CATEGORIES } from "./site";
export async function discover({
  q = "",
  page = 1,
  kind,
  slug,
}: {
  q?: string;
  page?: number;
  kind?: string;
  slug?: string;
}) {
  const limit = 12,
    offset = (page - 1) * limit;
  if (q) {
    try {
      const filter = Prisma.sql`"isPublished"=true AND "searchDocument" @@ websearch_to_tsquery('english',${q.slice(0, 200)})`;
      const [items, counts] = await prisma.$transaction([
        prisma.$queryRaw<
          any[]
        >`SELECT id,slug,title,summary,category,"heroImage","heroImageAlt","sourceAuthor","publishedAt","readingMinutes",type FROM "Article" WHERE ${filter} ORDER BY ts_rank("searchDocument",websearch_to_tsquery('english',${q.slice(0, 200)})) DESC,"publishedAt" DESC LIMIT ${limit} OFFSET ${offset}`,
        prisma.$queryRaw<
          { count: number }[]
        >`SELECT count(*)::int AS count FROM "Article" WHERE ${filter}`,
      ]);
      return { items, total: counts[0]?.count ?? 0 };
    } catch (err) {
      console.warn("Full-text search query failed, returning empty:", err);
      return { items: [], total: 0 };
    }
  }
  const where: Prisma.ArticleWhereInput = { isPublished: true };
  if (kind === "category" && slug) {
    const matched = (CATEGORIES as readonly string[]).find(
      (c) =>
        c.toLowerCase() === slug.toLowerCase() ||
        c.toLowerCase() === slug.replaceAll("-", " ").toLowerCase(),
    );
    if (matched) {
      where.category = { equals: matched, mode: "insensitive" };
    } else {
      try {
        const t = await prisma.taxonomy.findUnique({
          where: { kind_slug: { kind: "CATEGORY", slug } },
        });
        where.category = {
          equals: t?.name || slug.replaceAll("-", " "),
          mode: "insensitive",
        };
      } catch {
        where.category = {
          equals: slug.replaceAll("-", " "),
          mode: "insensitive",
        };
      }
    }
  }
  if (kind === "tag") where.tags = { has: slug };
  if (kind === "audience") where.audiences = { has: slug };
  if (kind === "source") {
    try {
      const t = await prisma.taxonomy.findUnique({
        where: { kind_slug: { kind: "SOURCE", slug: slug! } },
      });
      where.sourceAuthor = {
        equals: t?.name || slug?.replaceAll("-", " "),
        mode: "insensitive",
      };
    } catch {
      where.sourceAuthor = {
        equals: slug?.replaceAll("-", " "),
        mode: "insensitive",
      };
    }
  }

  const selectFields = {
    id: true,
    slug: true,
    title: true,
    summary: true,
    category: true,
    heroImage: true,
    heroImageAlt: true,
    sourceAuthor: true,
    publishedAt: true,
    readingMinutes: true,
    type: true,
  } as const;

  try {
    const [items, total] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy: [{ publishedAt: "desc" }, { id: "asc" }],
        take: limit,
        skip: offset,
        select: selectFields,
      }),
      prisma.article.count({ where }),
    ]);
    return { items, total };
  } catch (err) {
    console.warn("discover query failed, returning empty:", err);
    return { items: [], total: 0 };
  }
}

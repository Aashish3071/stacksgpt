import prisma from "./db";
import { Prisma } from "@prisma/client";
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
    const filter = Prisma.sql`"isPublished"=true AND "searchDocument" @@ websearch_to_tsquery('english',${q.slice(0, 200)})`;
    const [items, counts] = await prisma.$transaction([
      prisma.$queryRaw<
        any[]
      >`SELECT id,slug,title,summary,category,"heroImage","heroImageAlt","sourceAuthor","publishedAt","readingMinutes",type FROM "Article" WHERE ${filter} ORDER BY ts_rank("searchDocument",websearch_to_tsquery('english',${q.slice(0, 200)})) DESC,"publishedAt" DESC LIMIT ${limit} OFFSET ${offset}`,
      prisma.$queryRaw<
        { count: number }[]
      >`SELECT count(*)::int AS count FROM "Article" WHERE ${filter}`,
    ]);
    return { items, total: counts[0].count };
  }
  const where: Prisma.ArticleWhereInput = { isPublished: true };
  if (kind === "category") {
    const t = await prisma.taxonomy.findUnique({
      where: { kind_slug: { kind: "CATEGORY", slug: slug! } },
    });
    where.category = {
      equals: t?.name || slug?.replaceAll("-", " "),
      mode: "insensitive",
    };
  }
  if (kind === "tag") where.tags = { has: slug };
  if (kind === "audience") where.audiences = { has: slug };
  if (kind === "source") {
    const t = await prisma.taxonomy.findUnique({
      where: { kind_slug: { kind: "SOURCE", slug: slug! } },
    });
    where.sourceAuthor = {
      equals: t?.name || slug?.replaceAll("-", " "),
      mode: "insensitive",
    };
  }
  const [items, total] = await prisma.$transaction([
    prisma.article.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { id: "asc" }],
      take: limit,
      skip: offset,
      select: {
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
      },
    }),
    prisma.article.count({ where }),
  ]);
  return { items, total };
}

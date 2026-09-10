import { notFound } from "next/navigation";
import type { Metadata } from "next";
import prisma from "@/lib/db";
import ArticleReader from "@/components/ArticleReader";
import ViewBeacon from "@/components/ViewBeacon";
import ArticleSchema from "@/components/ArticleSchema";
import { marked } from "marked";
import { siteUrl, isoDate } from "@/lib/site";

export const revalidate = 300;

interface Props {
  params: { slug: string };
}

const CARD_FIELDS = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  category: true,
  readingMinutes: true,
  publishedAt: true,
  sourceAuthor: true,
  heroImage: true,
  heroImageAlt: true,
  type: true,
} as const;

export async function generateStaticParams() {
  const articles = await prisma.article.findMany({
    where: { isPublished: true },
    select: { slug: true },
    orderBy: { publishedAt: "desc" },
    take: 200,
  });
  return articles.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await prisma.article.findUnique({
    where: { slug: params.slug },
    select: {
      title: true,
      summary: true,
      publishedAt: true,
      isPublished: true,
      seoTitle: true,
      metaDescription: true,
      keywords: true,
      heroImage: true,
      heroImageAlt: true,
      sourcePublishedAt: true,
    },
  });

  if (!article || !article.isPublished) {
    return { title: "Article not found", robots: { index: false, follow: false } };
  }

  const url = siteUrl(`/article/${params.slug}`);
  // Fall back to the on-page copy so a page is never missing a title or
  // description, even for articles imported before the SEO fields existed.
  const title = article.seoTitle || article.title;
  const description = article.metaDescription || article.summary;

  let keywords: string[] = [];
  try {
    const parsed = JSON.parse(article.keywords || "[]");
    if (Array.isArray(parsed)) keywords = parsed.map(String);
  } catch {
    keywords = [];
  }

  const images = article.heroImage
    ? [{ url: siteUrl(article.heroImage), alt: article.heroImageAlt || title }]
    : undefined;

  return {
    title,
    description,
    // Google ignores this tag; emitted for other engines and internal grouping.
    keywords: keywords.length ? keywords : undefined,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      type: "article",
      url,
      images,
      publishedTime: isoDate(article.publishedAt) || undefined,
      modifiedTime: isoDate(article.publishedAt) || undefined,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      images: images?.map((i) => i.url),
    },
    robots: { index: true, follow: true },
  };
}

export default async function ArticlePage({ params }: Props) {
  const article = await prisma.article.findUnique({
    where: { slug: params.slug },
    include: { primaryTool: true },
  });

  if (!article || !article.isPublished) {
    notFound();
  }

  const related = await prisma.article.findMany({
    where: {
      isPublished: true,
      category: article.category,
      NOT: { id: article.id },
    },
    orderBy: { publishedAt: "desc" },
    take: 3,
    select: CARD_FIELDS,
  });

  // Parsed here rather than in the client component so the schema renders in HTML.
  let useCases: Array<{ title: string; stepByStep: string[] }> = [];
  try {
    const parsed = JSON.parse(article.useCases || "[]");
    if (Array.isArray(parsed)) useCases = parsed;
  } catch {
    useCases = [];
  }

  // Markdown body is rendered on the server so it ships as HTML, not JS.
  const bodyHtml = article.body ? await marked.parse(article.body) : null;

  return (
    <>
      <ArticleSchema
        title={article.title}
        summary={article.summary}
        slug={article.slug}
        publishedAt={article.publishedAt}
        useCases={useCases}
      />
      <ArticleReader article={{ ...article, bodyHtml }} related={related} />
      <ViewBeacon slug={article.slug} />
    </>
  );
}

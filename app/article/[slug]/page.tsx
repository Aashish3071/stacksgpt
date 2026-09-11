import { publicArticle } from "@/lib/public-article";
import { permanentRedirect } from "next/navigation";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import prisma from "@/lib/db";
import ArticleReader from "@/components/ArticleReader";
import ViewBeacon from "@/components/ViewBeacon";
import ArticleSchema from "@/components/ArticleSchema";
import { safeMarkdown } from "@/lib/safe-markdown";
import { siteUrl, isoDate } from "@/lib/site";

export const revalidate = 300;

interface Props {
  params: Promise<{ slug: string }>;
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
  try {
    const articles = await prisma.article.findMany({
      where: { isPublished: true },
      select: { slug: true },
      orderBy: { publishedAt: { sort: "desc", nulls: "last" } },
      take: 200,
    });
    return articles.map(({ slug }) => ({ slug }));
  } catch (err) {
    console.warn(
      "generateStaticParams skipped during build (database unmigrated or unreachable):",
      err,
    );
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  let article: any = null;
  try {
    article = await prisma.article.findUnique({
      where: { slug: (await params).slug },
      select: {
        title: true,
        summary: true,
        publishedAt: true,
        publishedUpdatedAt: true,
        isPublished: true,
        seoTitle: true,
        metaDescription: true,
        keywords: true,
        tags: true,
        heroImage: true,
        heroImageAlt: true,
        sourcePublishedAt: true,
      },
    });
  } catch {
    article = null;
  }

  if (!article || !article.isPublished) {
    return {
      title: "Article not found",
      robots: { index: false, follow: false },
    };
  }

  const url = siteUrl(`/article/${(await params).slug}`);
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

  const tags: string[] =
    Array.isArray(article.tags) && article.tags.length > 0
      ? article.tags
      : keywords.map((k) =>
          k
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, ""),
        );

  const allKeywords = Array.from(
    new Set([...keywords, ...tags.map((t) => t.replaceAll("-", " "))]),
  );

  const images = article.heroImage
    ? [
        {
          url: article.heroImage.startsWith("https://")
            ? article.heroImage
            : siteUrl(article.heroImage),
          alt: article.heroImageAlt || title,
        },
      ]
    : undefined;

  return {
    title,
    description,
    // Google ignores this tag; emitted for other engines and internal grouping.
    keywords: allKeywords.length ? allKeywords : undefined,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      type: "article",
      url,
      images,
      tags: tags.length ? tags : undefined,
      publishedTime: isoDate(article.publishedAt) || undefined,
      modifiedTime:
        isoDate(article.publishedUpdatedAt || article.publishedAt) || undefined,
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
  let article: any = null;
  let related: any[] = [];

  try {
    article = await prisma.article.findUnique({
      where: { slug: (await params).slug },
      include: { primaryTool: true },
    });

    if (article && article.isPublished) {
      related = await prisma.article.findMany({
        where: {
          isPublished: true,
          category: article.category,
          NOT: { id: article.id },
        },
        orderBy: { publishedAt: { sort: "desc", nulls: "last" } },
        take: 3,
        select: CARD_FIELDS,
      });
    }
  } catch (err) {
    console.warn("Could not load article from database:", err);
  }

  if (!article || !article.isPublished) {
    try {
      const old = await prisma.articleRedirect.findUnique({
        where: { slug: (await params).slug },
        include: { article: { select: { slug: true, isPublished: true } } },
      });
      if (old?.article.isPublished)
        permanentRedirect(`/article/${old.article.slug}`);
    } catch (err) {
      console.warn("Could not check article redirect:", err);
    }
    notFound();
  }

  // Parsed here rather than in the client component so the schema renders in HTML.
  let useCases: Array<{ title: string; stepByStep: string[] }> = [];
  try {
    const parsed = JSON.parse(article.useCases || "[]");
    if (Array.isArray(parsed)) useCases = parsed;
  } catch {
    useCases = [];
  }

  // Markdown body is rendered on the server so it ships as HTML, not JS.
  const bodyHtml = article.body ? await safeMarkdown(article.body) : null;

  let author: { displayName: string } | null = null;
  try {
    author = article.authorId
      ? await prisma.profile.findUnique({
          where: { id: article.authorId },
          select: { displayName: true },
        })
      : null;
  } catch (err) {
    console.warn("Could not load author profile:", err);
  }

  try {
    if (
      article.primaryTool?.affiliateUrl &&
      !(await prisma.partnerLink.findFirst({
        where: {
          url: article.primaryTool.affiliateUrl,
          active: true,
          partner: { active: true },
        },
      }))
    )
      article.primaryTool = {
        ...article.primaryTool,
        affiliateUrl: null,
        status: "NONE",
      };
  } catch (err) {
    console.warn("Could not verify partner link:", err);
  }
  let articleKeywords: string[] = [];
  try {
    const parsed = JSON.parse(article.keywords || "[]");
    if (Array.isArray(parsed)) articleKeywords = parsed.map(String);
  } catch {}
  if (Array.isArray(article.tags) && article.tags.length) {
    articleKeywords = Array.from(new Set([...articleKeywords, ...article.tags]));
  }

  return (
    <>
      <ArticleSchema
        title={article.title}
        summary={article.summary}
        slug={article.slug}
        publishedAt={article.publishedAt}
        updatedAt={article.publishedUpdatedAt || article.publishedAt}
        image={article.heroImage}
        authorName={author?.displayName}
        category={article.category}
        keywords={articleKeywords}
      />
      <ArticleReader
        article={{
          ...publicArticle(article),
          bodyHtml,
          authorName: author?.displayName,
        }}
        related={related}
      />
      <ViewBeacon slug={article.slug} />
    </>
  );
}

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import prisma from "@/lib/db";
import ArticleCard from "@/components/ArticleCard";
import { CATEGORIES, siteUrl } from "@/lib/site";

export const revalidate = 300;

interface Props {
  params: { slug: string };
}

/** Maps a url slug back to the canonical category name, or null if unknown. */
function resolveCategory(slug: string): string | null {
  const decoded = decodeURIComponent(slug).toLowerCase();
  return CATEGORIES.find((c) => c.toLowerCase() === decoded) ?? null;
}

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.toLowerCase() }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = resolveCategory(params.slug);
  if (!category) return { title: "Category not found", robots: { index: false } };

  return {
    title: `${category} — AI news you can use`,
    description: `Every ${category.toLowerCase()} story, explained in plain English with practical ways to use it.`,
    alternates: { canonical: siteUrl(`/category/${params.slug.toLowerCase()}`) },
  };
}

export default async function CategoryPage({ params }: Props) {
  const category = resolveCategory(params.slug);
  if (!category) notFound();

  let articles: any[] = [];
  try {
    articles = await prisma.article.findMany({
      where: { isPublished: true, category },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 60,
      select: {
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
      },
    });
  } catch (err) {
    console.warn("Could not query category articles during build/render:", err);
  }

  return (
    <div className="mx-auto max-w-shell px-4 py-10 sm:px-6">
      <header className="border-b border-rule pb-4">
        <h1 className="font-serif text-head-lg font-semibold text-ink">{category}</h1>
        <p className="meta mt-2">
          {articles.length === 0
            ? "No stories in this section yet."
            : `${articles.length} ${articles.length === 1 ? "story" : "stories"}`}
        </p>
      </header>

      {articles.length > 0 && (
        <div className="grid gap-x-8 gap-y-9 pt-8 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}

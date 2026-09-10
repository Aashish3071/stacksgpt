import Link from "next/link";
import type { Metadata } from "next";
import prisma from "@/lib/db";
import ArticleCard, { ArticleCardData } from "@/components/ArticleCard";
import NewsletterCard from "@/components/NewsletterCard";
import AdSlot from "@/components/AdSlot";
import { CATEGORIES, categoryHref, siteUrl } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  alternates: { canonical: siteUrl() },
};

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

/** How many stories each category strip shows. */
const PER_CATEGORY = 4;

/**
 * The homepage.
 *
 * Layout sequence requested:
 * 1. Hero article
 * 2. Suggested articles time-added-wise in the square cards section
 * 3. Article category-wise sections
 * 4. Subscribe to mail list section
 * 5. Footer (rendered via RootLayout)
 */
export default async function HomePage() {
  const articles = await prisma.article.findMany({
    where: { isPublished: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 60,
    select: CARD_FIELDS,
  });

  if (articles.length === 0) {
    return (
      <div className="mx-auto max-w-measure px-4 py-24 text-center sm:px-6">
        <h1 className="font-serif text-head-lg text-ink">No articles published yet</h1>
        <p className="meta mt-3 leading-relaxed">
          Review and approve incoming drafts in the admin panel to publish stories here.
        </p>
      </div>
    );
  }

  const [hero, ...rest] = articles as ArticleCardData[];

  // Suggested articles ordered time added-wise (newest first, square cards)
  const suggestedArticles = rest.slice(0, 8);

  // Category-wise sections
  const sections = CATEGORIES.map((category) => ({
    category,
    items: rest.filter((a) => a.category === category).slice(0, PER_CATEGORY),
  })).filter((s) => s.items.length >= 1);

  return (
    <div className="mx-auto max-w-shell px-4 sm:px-6">
      {/* 1 — Hero Article */}
      <section className="border-b border-rule py-8 sm:py-10">
        <ArticleCard article={hero} variant="lead" />
      </section>

      <AdSlot placement="home-leaderboard" />

      {/* 2 — Suggested Articles (Time Added-wise in Square Cards) */}
      {suggestedArticles.length > 0 && (
        <section className="border-b border-rule py-8 sm:py-10">
          <div className="flex items-baseline justify-between border-b border-rule pb-2">
            <h2 className="kicker text-ink font-semibold tracking-wide">Suggested Articles</h2>
            <span className="meta text-xs">Newest additions</span>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 pt-6 sm:gap-x-8 lg:grid-cols-4">
            {suggestedArticles.map((article) => (
              <ArticleCard key={article.id} article={article} variant="square" />
            ))}
          </div>
        </section>
      )}

      <AdSlot placement="home-in-feed" />

      {/* 3 — Category-wise Sections */}
      {sections.map(({ category, items }) => (
        <section key={category} className="border-b border-rule py-8 sm:py-10">
          <div className="flex items-baseline justify-between border-b border-rule pb-2">
            <h2 className="kicker text-ink font-semibold tracking-wide">{category}</h2>
            <Link href={categoryHref(category)} className="meta text-xs hover:text-accent">
              More in {category.toLowerCase()} →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 pt-6 sm:gap-x-8 lg:grid-cols-4">
            {items.map((article) => (
              <ArticleCard key={article.id} article={article} variant="square" />
            ))}
          </div>
        </section>
      ))}

      {/* 4 — Subscribe to Mail List Section */}
      <NewsletterCard />
    </div>
  );
}

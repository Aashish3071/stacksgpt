import Link from "next/link";
import type { Metadata } from "next";
import prisma from "@/lib/db";
import ArticleCard, { ArticleCardData } from "@/components/ArticleCard";
import NewsletterCard from "@/components/NewsletterCard";
import AdSlot from "@/components/AdSlot";
import { CATEGORIES, categoryHref, siteUrl, SITE_NAME } from "@/lib/site";
import { jsonLd } from "@/lib/safe-markdown";

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
 * Homepage layout:
 * 1. Hero article (latest published, full-width)
 * 2. Latest articles grid (next 4-8 newest, square cards)
 * 3. Category sections (Productivity, Coding, Research, Design, Automation)
 * 4. Newsletter subscribe CTA
 * 5. Footer (rendered via RootLayout)
 */
export default async function HomePage() {
  let articles: ArticleCardData[] = [];
  try {
    articles = await prisma.article.findMany({
      where: { isPublished: true },
      orderBy: [
        { publishedAt: "desc" },
        { createdAt: "desc" },
      ],
      take: 60,
      select: CARD_FIELDS,
    });
  } catch (err) {
    console.warn(
      "Could not query articles on HomePage during build/render:",
      err,
    );
  }

  if (articles.length === 0) {
    return (
      <div className="mx-auto max-w-measure px-4 py-24 text-center sm:px-6">
        <h1 className="font-serif text-head-lg text-ink">
          No articles published yet
        </h1>
        <p className="meta mt-3 leading-relaxed">
          Our first stories are being prepared. Check back for clear reporting
          on AI and technology.
        </p>
      </div>
    );
  }

  const [hero, ...rest] = articles as ArticleCardData[];

  // Latest articles: next 8 newest across all categories
  const latestArticles = rest.slice(0, 8);

  // Category sections: only show categories with published content
  const sections = CATEGORIES
    .map((category) => ({
      category,
      items: rest.filter((a) => a.category === category).slice(0, PER_CATEGORY),
    }))
    .filter((s) => s.items.length >= 1);

  // Schema.org structured data for the homepage
  const homepageSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url: siteUrl(),
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: siteUrl("/search?q={search_term_string}"),
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        name: SITE_NAME,
        url: siteUrl(),
        logo: siteUrl("/images/logos/logo.jpg"),
        description:
          "We track the latest AI and tech developments so you do not have to, delivering what is new and why it matters.",
      },
    ],
  };

  return (
    <div className="mx-auto max-w-shell px-4 sm:px-6">
      {/* Homepage JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(homepageSchema),
        }}
      />

      {/* 1: Hero Article */}
      <section className="border-b border-rule py-8 sm:py-10">
        <ArticleCard article={hero} variant="lead" />
      </section>

      <AdSlot placement="home-leaderboard" />

      {/* 2: Latest Stories (newest additions, square cards) */}
      {latestArticles.length > 0 && (
        <section className="border-b border-rule py-8 sm:py-10">
          <div className="flex items-baseline justify-between border-b border-rule pb-2">
            <h2 className="kicker text-ink font-semibold tracking-wide">
              Latest Stories
            </h2>
            <Link
              href="/latest"
              className="meta text-xs hover:text-accent"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 pt-6 sm:gap-x-8 lg:grid-cols-4">
            {latestArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                variant="square"
              />
            ))}
          </div>
        </section>
      )}

      <AdSlot placement="home-in-feed" />

      {/* 3: Category Sections */}
      {sections.map(({ category, items }) => (
        <section key={category} className="border-b border-rule py-8 sm:py-10">
          <div className="flex items-baseline justify-between border-b border-rule pb-2">
            <h2 className="kicker text-ink font-semibold tracking-wide">
              {category}
            </h2>
            <Link
              href={categoryHref(category)}
              className="meta text-xs hover:text-accent"
            >
              More in {category.toLowerCase()}
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 pt-6 sm:gap-x-8 lg:grid-cols-4">
            {items.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                variant="square"
              />
            ))}
          </div>
        </section>
      ))}

      {/* 4: Newsletter Subscribe CTA */}
      <div id="newsletter">
        <NewsletterCard />
      </div>
    </div>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import prisma from "@/lib/db";
import ArticleCard, { ArticleCardData } from "@/components/ArticleCard";
import NewsletterCard from "@/components/NewsletterCard";
import AdSlot from "@/components/AdSlot";
import { CATEGORIES, categoryHref, siteUrl, SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import { jsonLd } from "@/lib/safe-markdown";

export const revalidate = 60;

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

export default async function HomePage() {
  let articles: ArticleCardData[] = [];
  try {
    articles = await prisma.article.findMany({
      where: { isPublished: true },
      orderBy: [
        { publishedAt: { sort: "desc", nulls: "last" } },
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

  if (articles.length === 0) {
    return (
      <div className="mx-auto max-w-shell px-4 sm:px-6">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd(homepageSchema),
          }}
        />

        <div className="mx-auto max-w-2xl py-16 text-center sm:py-24">
          <span className="font-mono text-xs uppercase tracking-widest text-accent font-semibold">
            The Intelligence Dispatch
          </span>
          <h1 className="mt-4 font-serif text-3xl font-bold leading-tight text-ink sm:text-5xl">
            {SITE_TAGLINE}
          </h1>
          <p className="meta mt-4 text-base leading-relaxed text-muted sm:text-lg">
            Our newsroom is reviewing and preparing fresh stories. Subscribe below to
            receive breaking model announcements, benchmark teardowns, and practical
            briefings as soon as they publish.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/tools"
              prefetch={true}
              className="rounded-lg border border-rule bg-paper px-4 py-2 font-sans text-sm font-medium text-ink hover:border-ink transition-colors"
            >
              Browse AI Tools Directory →
            </Link>
          </div>
        </div>

        <div id="newsletter" className="pb-12">
          <NewsletterCard />
        </div>
      </div>
    );
  }

  const [hero, ...rest] = articles as ArticleCardData[];
  const latestArticles = rest.slice(0, 8);

  const sections = CATEGORIES
    .map((category) => ({
      category,
      items: rest.filter((a) => a.category === category).slice(0, PER_CATEGORY),
    }))
    .filter((s) => s.items.length >= 1);

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
              prefetch={true}
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
              prefetch={true}
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

import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import prisma from "@/lib/db";
import { getMemberStatus } from "@/lib/member";
import BlueprintCard, { BlueprintCardData } from "@/components/BlueprintCard";
import ArticleCard, { ArticleCardData } from "@/components/ArticleCard";
import NewsletterCard from "@/components/NewsletterCard";
import TemplateCard from "@/components/TemplateCard";
import { listTemplates, TEMPLATE_CATEGORIES } from "@/lib/templates";
import { siteUrl, SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import { jsonLd } from "@/lib/safe-markdown";
import { ArrowRight } from "lucide-react";

export const revalidate = 60;

const DESCRIPTION =
  "Plain-English guides for putting AI to work in your business, with free step-by-step setups. Plus the AI news worth knowing about.";

export const metadata: Metadata = {
  alternates: { canonical: siteUrl() },
  openGraph: {
    title: `${SITE_NAME} · ${SITE_TAGLINE}`,
    description: DESCRIPTION,
    url: siteUrl(),
    siteName: SITE_NAME,
    type: "website",
    images: [
      {
        url: siteUrl("/images/logos/logo.jpg"),
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} - ${SITE_TAGLINE}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} · ${SITE_TAGLINE}`,
    description: DESCRIPTION,
    images: [siteUrl("/images/logos/logo.jpg")],
  },
};

const HOW_IT_WORKS = [
  {
    title: "Pick a problem",
    body: "Choose a guide for the work you want to hand off, from sorting email to finding leads.",
  },
  {
    title: "Read how it works",
    body: "Every guide explains the problem, what you get and what you need in plain English.",
  },
  {
    title: "Unlock the setup",
    body: "Enter your email to get the step-by-step setup and a workflow file you can import.",
  },
];

function SectionHeader({ title, href, linkLabel }: { title: string; href: string; linkLabel: string }) {
  return (
    <div className="flex items-end justify-between gap-4 border-b border-rule pb-4">
      <h2 className="font-serif text-2xl font-bold text-ink sm:text-3xl">{title}</h2>
      <Link href={href} className="shrink-0 text-sm font-semibold text-accent hover:underline">
        {linkLabel} →
      </Link>
    </div>
  );
}

export default async function HomePage() {
  const member = await getMemberStatus();

  let blueprints: BlueprintCardData[] = [];
  try {
    const published = await prisma.blueprint.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        outcome: true,
        goal: true,
        difficulty: true,
        setupTime: true,
        heroImage: true,
        heroImageAlt: true,
      },
    });
    blueprints = published.slice(0, 3);
  } catch (err) {
    console.warn("Could not query blueprints on HomePage:", err);
  }

  let articles: ArticleCardData[] = [];
  try {
    articles = await prisma.article.findMany({
      where: { isPublished: true },
      orderBy: [{ publishedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
      take: 4,
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
        type: true,
      },
    });
  } catch (err) {
    console.warn("Could not query articles on HomePage:", err);
  }

  const featuredTemplates = TEMPLATE_CATEGORIES.flatMap((c) => listTemplates(c.slug).slice(0, 1)).slice(0, 3);

  const homepageSchema = {
    "@context": "https://schema.org",
    "@graph": [{ "@type": "WebSite", name: SITE_NAME, url: siteUrl(), description: SITE_TAGLINE }],
  };

  return (
    <div className="w-full bg-paper">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(homepageSchema) }} />

      {/* Hero */}
      <section className="border-b border-rule bg-surface/50 py-12 sm:py-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-6 xl:col-span-7">
            <h1 className="font-serif text-3xl font-bold tracking-tight text-ink sm:text-5xl sm:leading-[1.15]">
              Put AI to work with step-by-step blueprints
            </h1>
            <p className="mt-5 text-base leading-relaxed text-ink/75 sm:text-lg">
              Plain-English guides for your inbox, leads, content and operations. See how each one works,
              then unlock the free setup and workflow file.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/blueprints"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-[2px] bg-ink px-5 py-3 text-sm font-semibold text-paper shadow-sm transition hover:bg-ink/90"
              >
                <span>Explore All Blueprints</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#newsletter"
                className="inline-flex min-h-[44px] items-center rounded-[2px] border border-rule bg-paper px-5 py-3 text-sm font-medium text-ink transition hover:border-ink/40"
              >
                Get new guides by email
              </a>
            </div>
          </div>

          <div className="lg:col-span-6 xl:col-span-5">
            <div className="overflow-hidden rounded-[2px] border border-rule bg-paper p-2 shadow-xl">
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[2px] bg-ink">
                <Image
                  src="/images/homepage-hero-workflows.png"
                  alt="Team collaborating around AI blueprints for growth forecasting, lead scoring, and content automation"
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 45vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-rule py-10">
        <ol className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
          {HOW_IT_WORKS.map((step, idx) => (
            <li key={step.title} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink font-serif text-sm font-bold text-paper">
                {idx + 1}
              </span>
              <div>
                <p className="font-semibold text-ink">{step.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-ink/70">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Latest blueprints */}
      {blueprints.length > 0 && (
        <section className="border-t border-rule py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <SectionHeader title="Latest Blueprints" href="/blueprints" linkLabel="All blueprints" />
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {blueprints.map((bp) => (
                <BlueprintCard key={bp.id} blueprint={bp} isUnlocked={member.isMember} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Workflow templates */}
      {featuredTemplates.length > 0 && (
        <section className="py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <SectionHeader title="Ready-Made Workflow Templates" href="/blueprints/templates" linkLabel="All templates" />
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredTemplates.map((template) => (
                <TemplateCard key={template.slug} template={template} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="border-y border-rule bg-surface py-12">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <NewsletterCard />
        </div>
      </section>

      {/* AI news */}
      {articles.length > 0 && (
        <section className="border-t border-rule py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <SectionHeader title="Latest AI News" href="/latest" linkLabel="All AI news" />
            <div className="mt-4 grid grid-cols-1 divide-y divide-rule sm:grid-cols-2 sm:gap-x-10 sm:divide-y-0">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} variant="compact" />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

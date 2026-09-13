import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import prisma from "@/lib/db";
import { getMemberStatus } from "@/lib/member";
import BlueprintCard, { BlueprintCardData } from "@/components/BlueprintCard";
import ArticleCard, { ArticleCardData } from "@/components/ArticleCard";
import NewsletterCard from "@/components/NewsletterCard";
import {
  BLUEPRINT_GOALS,
  siteUrl,
  SITE_NAME,
  SITE_TAGLINE,
} from "@/lib/site";
import { jsonLd } from "@/lib/safe-markdown";
import { ArrowRight, Sparkles, Wrench, ChevronRight } from "lucide-react";

export const revalidate = 60;

export const metadata: Metadata = {
  alternates: { canonical: siteUrl() },
  openGraph: {
    title: `${SITE_NAME} · ${SITE_TAGLINE}`,
    description:
      "Step-by-step blueprints, agents, and automations to put AI to work. Plus reported AI news and tools.",
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
    description:
      "Step-by-step blueprints, agents, and automations to put AI to work. Plus reported AI news and tools.",
    images: [siteUrl("/images/logos/logo.jpg")],
  },
};

export default async function HomePage() {
  const member = await getMemberStatus();

  let blueprints: BlueprintCardData[] = [];
  try {
    blueprints = (await prisma.blueprint.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: "desc" },
      take: 6,
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        outcome: true,
        goal: true,
        roles: true,
        tools: true,
        difficulty: true,
        setupTime: true,
        heroImage: true,
        heroImageAlt: true,
        unlockCount: true,
      },
    })) as any;

    blueprints = blueprints.map((b) => ({
      ...b,
      tools: Array.isArray(b.tools)
        ? b.tools.map((t: string) => (t.toLowerCase() === "n8n" ? "automation" : t))
        : b.tools,
    }));
  } catch (err) {
    console.warn("Could not query blueprints on HomePage:", err);
  }

  let articles: ArticleCardData[] = [];
  try {
    articles = (await prisma.article.findMany({
      where: { isPublished: true },
      orderBy: [
        { publishedAt: { sort: "desc", nulls: "last" } },
        { createdAt: "desc" },
      ],
      take: 6,
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
    })) as any;
  } catch (err) {
    console.warn("Could not query articles on HomePage:", err);
  }


  // Popular tools derived from blueprints (exclude specific runner tools like n8n per editorial policy)
  const toolsSet = new Set<string>();
  blueprints.forEach((b) => {
    if (Array.isArray(b.tools)) {
      b.tools.forEach((t) => {
        if (t.toLowerCase() !== "n8n") {
          toolsSet.add(t);
        }
      });
    }
  });
  const popularTools = Array.from(toolsSet).slice(0, 6);

  const homepageSchema: any = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url: siteUrl(),
        description: SITE_TAGLINE,
      },
    ],
  };

  return (
    <div className="w-full bg-paper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(homepageSchema) }}
      />

      {/* 1. Hero Section */}
      <section className="border-b border-rule bg-surface/50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-6 xl:col-span-7">
              <h1 className="font-serif text-3xl font-bold tracking-tight text-ink sm:text-5xl sm:leading-[1.15]">
                Put AI to work with step-by-step blueprints
              </h1>
              <p className="mt-4 text-base leading-relaxed text-ink/75 sm:text-lg">
                Agents, skills and automations for your inbox, leads, content and ops.
                Each blueprint gives you the setup, the templates and the prompts to run it yourself.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/blueprints"
                  className="inline-flex items-center gap-2 rounded-[2px] bg-ink px-5 py-3 text-sm font-semibold text-paper shadow-sm transition hover:bg-ink/90"
                >
                  <span>Explore All Blueprints</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/latest"
                  className="inline-flex items-center gap-2 rounded-[2px] border border-rule bg-paper px-4 py-3 text-sm font-medium text-ink transition hover:bg-rule"
                >
                  <span>Read AI News</span>
                </Link>
              </div>
            </div>

            {/* Editorial Hero Graphic */}
            <div className="lg:col-span-6 xl:col-span-5">
              <div className="group relative overflow-hidden rounded-[2px] border border-rule bg-paper p-2 shadow-xl transition-all hover:border-ink/30">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[2px] bg-ink">
                  <Image
                    src="/images/homepage-hero-workflows.png"
                    alt="AI Agent Workflows and Automation Engineering Architecture Diagram"
                    fill
                    priority
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    sizes="(max-width: 1024px) 100vw, 45vw"
                  />
                </div>
                <div className="px-3 pt-3 pb-1 flex items-center justify-between text-xs text-muted font-sans border-t border-rule/60 mt-2">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-accent font-semibold">
                    Production Architecture
                  </span>
                  <span>End-to-end AI agent orchestration</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Latest Blueprints Grid */}
      <section className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between border-b border-rule pb-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                Actionable Playbooks
              </span>
              <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-bold text-ink">
                Latest Blueprints
              </h2>
            </div>
            <Link
              href="/blueprints"
              className="text-xs font-semibold uppercase tracking-wider text-ink/70 hover:text-accent"
            >
              All Blueprints →
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {blueprints.map((bp) => (
              <BlueprintCard
                key={bp.id}
                blueprint={bp}
                isUnlocked={member.isMember}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 4. Popular Tools */}
      {popularTools.length > 0 && (
        <section className="border-t border-rule bg-surface py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink/60">
                Popular Tools:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {popularTools.map((tool) => (
                  <Link
                    key={tool}
                    href={`/blueprints/tool/${tool}`}
                    className="rounded-[2px] border border-rule bg-paper px-3 py-1 font-mono text-xs font-medium text-ink hover:border-ink"
                  >
                    {tool}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5. AI News Section */}
      <section className="border-t border-rule py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between border-b border-rule pb-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                Reporting
              </span>
              <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-bold text-ink">
                Latest AI News
              </h2>
            </div>
            <Link
              href="/latest"
              className="text-xs font-semibold uppercase tracking-wider text-ink/70 hover:text-accent"
            >
              All AI news →
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                variant="standard"
              />
            ))}
          </div>
        </div>
      </section>

      {/* 6. Newsletter Subscribe Band */}
      <section className="border-t border-rule bg-surface py-8">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <NewsletterCard />
        </div>
      </section>
    </div>
  );
}

import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import prisma from "@/lib/db";
import { getMemberStatus } from "@/lib/member";
import { safeMarkdown, jsonLd } from "@/lib/safe-markdown";
import BlueprintGate from "@/components/blueprint/BlueprintGate";
import BlueprintContentRenderer from "@/components/blueprint/BlueprintContentRenderer";
import BlueprintCard, { BlueprintCardData } from "@/components/BlueprintCard";
import {
  blueprintGoalLabel,
  blueprintDifficultyLabel,
  blueprintSetupTimeLabel,
  siteUrl,
  SITE_NAME,
  formatDate,
} from "@/lib/site";
import {
  Clock,
  BarChart,
  Lock,
  Unlock,
  ExternalLink,
  ChevronRight,
  Sparkles,
  CheckCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const blueprint = await prisma.blueprint.findUnique({
    where: { slug },
    select: {
      title: true,
      summary: true,
      seoTitle: true,
      metaDescription: true,
      heroImage: true,
    },
  });

  if (!blueprint) return {};

  const title = blueprint.seoTitle || `${blueprint.title} · ${SITE_NAME}`;
  const description = blueprint.metaDescription || blueprint.summary;

  return {
    title,
    description,
    alternates: { canonical: siteUrl(`/blueprints/${slug}`) },
    openGraph: {
      title,
      description,
      url: siteUrl(`/blueprints/${slug}`),
      type: "article",
      images: blueprint.heroImage ? [{ url: siteUrl(blueprint.heroImage) }] : undefined,
    },
  };
}

export default async function BlueprintDetailPage({ params }: Props) {
  const { slug } = await params;
  const member = await getMemberStatus();

  const blueprint = await prisma.blueprint.findUnique({
    where: { slug },
  });

  if (!blueprint || (!blueprint.isPublished && process.env.NODE_ENV === "production")) {
    notFound();
  }

  const freeHtml = await safeMarkdown(blueprint.freeBody);
  const gatedHtml = member.isMember ? await safeMarkdown(blueprint.gatedBody) : "";

  // Parse references JSON
  const references: { title: string; url: string }[] = Array.isArray(blueprint.references)
    ? (blueprint.references as any)
    : [];

  // Find related blueprints
  let related: BlueprintCardData[] = [];
  try {
    related = (await prisma.blueprint.findMany({
      where: {
        isPublished: true,
        slug: { not: slug },
        OR: [
          { goal: blueprint.goal },
          { tools: { hasSome: blueprint.tools } },
        ],
      },
      take: 3,
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
  } catch (err) {
    console.error("Failed to load related blueprints:", err);
  }

  // Generate Table of Contents from headings
  const allH2s = (blueprint.freeBody + "\n" + blueprint.gatedBody).match(/^##\s+(.+)$/gm) || [];
  const tocItems = allH2s.map((h2) => {
    const text = h2.replace(/^##\s+/, "").trim();
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const isGatedSection = !blueprint.freeBody.includes(`## ${text}`);
    return { text, id, isGatedSection };
  });

  // Paywall schema.org JSON-LD
  const blueprintSchema: any = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: blueprint.title,
    description: blueprint.summary,
    image: blueprint.heroImage ? siteUrl(blueprint.heroImage) : undefined,
    datePublished: blueprint.publishedAt?.toISOString(),
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: siteUrl(),
    },
    isAccessibleForFree: member.isMember,
    hasPart: {
      "@type": "WebPageElement",
      isAccessibleForFree: false,
      cssSelector: ".blueprint-gated",
    },
  };

  const goalLabel = blueprintGoalLabel(blueprint.goal);
  const difficulty = blueprintDifficultyLabel(blueprint.difficulty);
  const setupTime = blueprintSetupTimeLabel(blueprint.setupTime);

  return (
    <div className="w-full bg-paper pt-8 pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(blueprintSchema) }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumbs" className="mb-6 flex items-center gap-1.5 text-xs text-ink/60">
          <Link href="/blueprints" className="hover:text-ink">
            Blueprints
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link
            href={`/blueprints/goal/${blueprint.goal}`}
            className="hover:text-ink font-medium text-ink/80"
          >
            {goalLabel}
          </Link>
        </nav>

        {/* Title Header */}
        <div className="max-w-4xl border-b border-rule pb-8">
          <div className="flex items-center gap-2">
            <span className="rounded bg-ink px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-paper">
              {goalLabel}
            </span>
            {member.isMember ? (
              <span className="inline-flex items-center gap-1 rounded bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                <Unlock className="h-3 w-3" />
                Unlocked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded bg-rule px-2.5 py-0.5 text-xs font-medium text-ink/70">
                <Lock className="h-3 w-3" />
                Free with email
              </span>
            )}
          </div>

          <h1 className="mt-4 font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink leading-[1.15]">
            {blueprint.title}
          </h1>

          <p className="mt-4 text-base sm:text-lg leading-relaxed text-ink/80">
            {blueprint.summary}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-ink/70 font-mono">
            {blueprint.publishedAt && (
              <span>Updated {formatDate(blueprint.publishedAt)}</span>
            )}
            <span>·</span>
            <span>Difficulty: {difficulty}</span>
            <span>·</span>
            <span>Setup time: {setupTime}</span>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Main Content Column */}
          <div className="lg:col-span-8">
            {/* Hero Cover Image */}
            {blueprint.heroImage && (
              <div className="relative mb-10 aspect-[16/9] w-full overflow-hidden rounded-[2px] border border-rule bg-rule/30">
                <Image
                  src={blueprint.heroImage}
                  alt={blueprint.heroImageAlt || blueprint.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover"
                />
              </div>
            )}

            {/* Free Content (Rendered for everyone) */}
            <BlueprintContentRenderer
              html={freeHtml}
              className="prose prose-slate max-w-none text-ink/90 prose-headings:font-serif prose-headings:font-bold prose-headings:text-ink prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-lg prose-h3:mt-6 prose-p:leading-relaxed prose-pre:bg-zinc-900 prose-pre:text-zinc-100 prose-code:font-mono"
            />

            {/* Gate Section */}
            {!member.isMember ? (
              <BlueprintGate
                slug={blueprint.slug}
                manifest="Step-by-step setup · Production templates · Starter prompts"
              />
            ) : (
              /* Gated Content (Rendered only for authenticated members) */
              <div className="blueprint-gated mt-8 border-t border-rule pt-8">
                <div className="mb-6 flex items-center gap-2 rounded-[2px] bg-accent/10 p-3 text-xs font-medium text-accent">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span>Full member blueprint unlocked. Run through the steps below.</span>
                </div>
                <BlueprintContentRenderer
                  html={gatedHtml}
                  className="prose prose-slate max-w-none text-ink/90 prose-headings:font-serif prose-headings:font-bold prose-headings:text-ink prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-lg prose-h3:mt-6 prose-p:leading-relaxed prose-pre:bg-zinc-900 prose-pre:text-zinc-100 prose-code:font-mono"
                />
              </div>
            )}

            {/* Official References (Always Free) */}
            {references.length > 0 && (
              <section className="mt-14 border-t border-rule pt-8">
                <h2 className="font-serif text-xl font-bold text-ink">
                  Official Documentation &amp; References
                </h2>
                <ul className="mt-4 space-y-2">
                  {references.map((ref, idx) => {
                    let domain = "";
                    try {
                      domain = new URL(ref.url).hostname;
                    } catch {
                      domain = "external";
                    }
                    return (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <ExternalLink className="h-3.5 w-3.5 text-accent shrink-0" />
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-ink hover:text-accent underline"
                        >
                          {ref.title}
                        </a>
                        <span className="text-xs text-ink/50 font-mono">({domain})</span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </div>

          {/* Sticky Side Column */}
          <aside className="lg:col-span-4">
            <div className="sticky top-20 space-y-6">
              {/* At a Glance Box */}
              <div className="rounded-[2px] border border-rule bg-surface p-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink/70">
                  At a Glance
                </h3>

                <div className="mt-4 space-y-4 text-xs">
                  {blueprint.outcome && (
                    <div>
                      <span className="font-medium text-ink/60">What you build:</span>
                      <p className="mt-1 text-ink font-medium leading-relaxed">
                        {blueprint.outcome}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-rule pt-3">
                    <span className="text-ink/60">Difficulty:</span>
                    <span className="font-semibold text-ink inline-flex items-center gap-1">
                      <BarChart className="h-3.5 w-3.5" />
                      {difficulty}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-rule pt-3">
                    <span className="text-ink/60">Setup time:</span>
                    <span className="font-semibold text-ink inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {setupTime}
                    </span>
                  </div>

                  {blueprint.tools && blueprint.tools.length > 0 && (
                    <div className="border-t border-rule pt-3">
                      <span className="text-ink/60">Tools used:</span>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {blueprint.tools.map((tool) => (
                          <Link
                            key={tool}
                            href={`/blueprints/tool/${tool}`}
                            className="rounded bg-paper border border-rule px-2 py-0.5 font-mono text-[11px] text-ink/80 hover:border-ink/40"
                          >
                            {tool}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {blueprint.costNotes && (
                    <div className="border-t border-rule pt-3">
                      <span className="text-ink/60">Cost notes:</span>
                      <p className="mt-1 text-ink/75 leading-relaxed">
                        {blueprint.costNotes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-6 border-t border-rule pt-4">
                  {member.isMember ? (
                    <div className="flex items-center gap-2 text-xs font-semibold text-accent">
                      <CheckCircle className="h-4 w-4" />
                      <span>You have unlocked this blueprint</span>
                    </div>
                  ) : (
                    <p className="text-xs text-ink/70">
                      Get free blueprint: Enter your email in the box to receive all templates and copy-paste prompts in your inbox.
                    </p>
                  )}
                </div>
              </div>

              {/* Table of Contents */}
              {tocItems.length > 0 && (
                <div className="rounded-[2px] border border-rule bg-surface p-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink/70 mb-3">
                    Table of Contents
                  </h3>
                  <ul className="space-y-2 text-xs">
                    {tocItems.map((item, idx) => (
                      <li key={idx} className="flex items-center justify-between">
                        <span className="truncate pr-2 text-ink/80 hover:text-ink">
                          {item.text}
                        </span>
                        {item.isGatedSection && !member.isMember ? (
                          <Lock className="h-3 w-3 text-ink/40 shrink-0" />
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Related Blueprints Section */}
        {related.length > 0 && (
          <section className="mt-20 border-t border-rule pt-12">
            <h2 className="font-serif text-2xl font-bold text-ink">
              Related Blueprints
            </h2>
            <p className="mt-1 text-xs text-ink/70">
              More workflows to put modern AI capabilities into operation.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((bp) => (
                <BlueprintCard
                  key={bp.id}
                  blueprint={bp}
                  isUnlocked={member.isMember}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

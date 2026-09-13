import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import prisma from "@/lib/db";
import { getMemberStatus } from "@/lib/member";
import { safeMarkdown, jsonLd } from "@/lib/safe-markdown";
import BlueprintGate from "@/components/blueprint/BlueprintGate";
import BlueprintContentRenderer from "@/components/blueprint/BlueprintContentRenderer";
import WorkflowDownloads from "@/components/blueprint/WorkflowDownloads";
import BlueprintCard, { BlueprintCardData } from "@/components/BlueprintCard";
import TemplateCard from "@/components/TemplateCard";
import { getTemplatesForBlueprint } from "@/lib/templates";
import {
  BLUEPRINT_ROLES,
  blueprintGoalLabel,
  blueprintDifficultyLabel,
  blueprintSetupTimeLabel,
  siteUrl,
  SITE_NAME,
} from "@/lib/site";
import { BarChart, ChevronRight, Clock, Users } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

const TOOL_LABELS: Record<string, string> = {
  apify: "Apify",
  apollo: "Apollo",
  "exa-ai": "Exa",
  instantly: "Instantly",
  linkedin: "LinkedIn",
  n8n: "n8n",
  openai: "OpenAI",
  serpapi: "SerpApi",
  whatsapp: "WhatsApp",
  wordpress: "WordPress",
};

function toolLabel(slug: string): string {
  return (
    TOOL_LABELS[slug] ??
    slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
}

function splitTechnicalDetails(markdown: string): { guide: string; technical: string } {
  const match = markdown.match(/^##\s+Technical\s+Details\s*$/im);
  if (!match || match.index === undefined) return { guide: markdown, technical: "" };
  return {
    guide: markdown.slice(0, match.index).trim(),
    technical: markdown.slice(match.index + match[0].length).trim(),
  };
}

const PROSE =
  "prose prose-slate max-w-none text-[16px] leading-relaxed text-ink/90 prose-headings:font-serif prose-headings:font-bold prose-headings:text-ink prose-h2:mt-12 prose-h2:mb-4 prose-h2:text-2xl prose-h3:mt-6 prose-h3:text-lg prose-p:leading-relaxed prose-li:my-1 prose-a:text-accent prose-pre:bg-zinc-900 prose-pre:text-zinc-100 prose-code:font-mono";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const blueprint = await prisma.blueprint.findUnique({
    where: { slug },
    select: { title: true, summary: true, seoTitle: true, metaDescription: true, heroImage: true },
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

  const blueprint = await prisma.blueprint.findUnique({ where: { slug } });

  if (!blueprint || (!blueprint.isPublished && process.env.NODE_ENV === "production")) {
    notFound();
  }

  const templates = getTemplatesForBlueprint(blueprint.slug);
  const downloads = templates.map((t) => ({ slug: t.slug, title: t.title }));

  const freeHtml = await safeMarkdown(blueprint.freeBody);
  const { guide, technical } = splitTechnicalDetails(blueprint.gatedBody);
  const guideHtml = member.isMember ? await safeMarkdown(guide) : "";
  const technicalHtml = member.isMember && technical ? await safeMarkdown(technical) : "";

  const references: { title: string; url: string }[] = Array.isArray(blueprint.references)
    ? (blueprint.references as { title: string; url: string }[])
    : [];

  let related: BlueprintCardData[] = [];
  try {
    related = await prisma.blueprint.findMany({
      where: {
        isPublished: true,
        slug: { not: slug },
        OR: [{ goal: blueprint.goal }, { tools: { hasSome: blueprint.tools } }],
      },
      take: 3,
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
  } catch (err) {
    console.error("Failed to load related blueprints:", err);
  }

  const blueprintSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: blueprint.title,
    description: blueprint.summary,
    image: blueprint.heroImage ? siteUrl(blueprint.heroImage) : undefined,
    datePublished: blueprint.publishedAt?.toISOString(),
    author: { "@type": "Organization", name: SITE_NAME, url: siteUrl() },
    isAccessibleForFree: member.isMember,
    hasPart: { "@type": "WebPageElement", isAccessibleForFree: false, cssSelector: ".blueprint-gated" },
  };

  const goalLabel = blueprintGoalLabel(blueprint.goal);
  const roleLabels = blueprint.roles.map(
    (role) => BLUEPRINT_ROLES.find((r) => r.slug === role)?.label ?? role,
  );
  const facts = [
    { icon: Users, label: "Who it's for", value: roleLabels.join(", ") },
    { icon: Clock, label: "Time needed", value: blueprintSetupTimeLabel(blueprint.setupTime) },
    { icon: BarChart, label: "Difficulty", value: blueprintDifficultyLabel(blueprint.difficulty) },
  ];

  return (
    <div className="w-full bg-paper pt-8 pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(blueprintSchema) }} />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumbs" className="mb-6 flex items-center gap-1.5 text-xs text-ink/60">
          <Link href="/blueprints" className="hover:text-ink">
            Blueprints
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={`/blueprints?goal=${blueprint.goal}`} className="font-medium text-ink/80 hover:text-ink">
            {goalLabel}
          </Link>
        </nav>

        <header className="max-w-3xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">{goalLabel}</span>
          <h1 className="mt-2 font-serif text-3xl font-bold leading-[1.15] tracking-tight text-ink sm:text-4xl lg:text-5xl">
            {blueprint.title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink/80">{blueprint.outcome || blueprint.summary}</p>

          <dl className="mt-6 grid grid-cols-1 gap-4 border-y border-rule py-4 sm:grid-cols-3">
            {facts.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-2.5">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <div>
                  <dt className="text-xs text-ink/60">{label}</dt>
                  <dd className="text-sm font-semibold text-ink">{value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </header>

        <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-12">
          <article className="lg:col-span-8">
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
            <BlueprintContentRenderer html={freeHtml} className={PROSE} />

            {member.isMember ? (
              <div className="blueprint-gated mt-12">
                {downloads.length > 0 && <WorkflowDownloads downloads={downloads} />}
                <BlueprintContentRenderer html={guideHtml} className={PROSE} />

                {technicalHtml && (
                  <details className="mt-12 rounded-[2px] border border-rule bg-surface">
                    <summary className="cursor-pointer select-none px-5 py-4">
                      <span className="font-serif text-lg font-bold text-ink">Technical details</span>
                      <span className="ml-2 text-xs text-ink/60">
                        For whoever builds it: workflow diagram and configuration
                      </span>
                    </summary>
                    <div className="border-t border-rule px-5 py-6">
                      <BlueprintContentRenderer html={technicalHtml} className={PROSE} />
                    </div>
                  </details>
                )}
              </div>
            ) : (
              <>
                <BlueprintGate slug={blueprint.slug} downloads={downloads} />
                {templates.length > 0 && (
                  <section className="mt-12">
                    <h2 className="font-serif text-xl font-bold text-ink">Workflow files used in this guide</h2>
                    <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                      {templates.map((template) => (
                        <TemplateCard key={template.slug} template={template} />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}

            {references.length > 0 && (
              <details className="mt-12 border-t border-rule pt-6 text-sm">
                <summary className="cursor-pointer select-none font-semibold text-ink/80">
                  Sources and documentation
                </summary>
                <ul className="mt-3 space-y-2">
                  {references.map((ref) => (
                    <li key={ref.url}>
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-ink underline hover:text-accent"
                      >
                        {ref.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </article>

          <aside className="lg:col-span-4">
            <div className="sticky top-20 space-y-6">
              {!member.isMember && (
                <div className="rounded-[2px] border border-rule bg-surface p-6">
                  <p className="font-serif text-lg font-bold text-ink">Free step-by-step guide</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink/75">
                    {downloads.length > 0
                      ? "Unlock the setup steps, the copy-paste prompt and the workflow file with your email."
                      : "Unlock the setup steps and the copy-paste prompt with your email."}
                  </p>
                  <a
                    href="#unlock"
                    className="mt-4 flex min-h-[44px] items-center justify-center rounded-[2px] bg-ink px-4 py-2.5 text-sm font-semibold text-paper transition hover:bg-ink/90"
                  >
                    Unlock the full guide
                  </a>
                </div>
              )}

              <div className="rounded-[2px] border border-rule bg-surface p-6 text-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink/70">At a Glance</h3>
                <dl className="mt-4 space-y-3">
                  {blueprint.tools.length > 0 && (
                    <div>
                      <dt className="text-xs text-ink/60">Apps used</dt>
                      <dd className="mt-1 text-ink">{blueprint.tools.map(toolLabel).join(", ")}</dd>
                    </div>
                  )}
                  {blueprint.costNotes && (
                    <div className="border-t border-rule pt-3">
                      <dt className="text-xs text-ink/60">Costs</dt>
                      <dd className="mt-1 leading-relaxed text-ink/80">{blueprint.costNotes}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="rounded-[2px] border border-rule bg-paper p-6 text-sm text-ink/75">
                <p className="font-semibold text-ink">Rather have it set up for you?</p>
                <p className="mt-1">We can build this workflow around your tools and data.</p>
                <Link href="/contact" className="mt-3 inline-flex font-semibold text-accent hover:underline">
                  Talk to Us
                </Link>
              </div>
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-20 border-t border-rule pt-12">
            <h2 className="font-serif text-2xl font-bold text-ink">More Blueprints Like This</h2>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((bp) => (
                <BlueprintCard key={bp.id} blueprint={bp} isUnlocked={member.isMember} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

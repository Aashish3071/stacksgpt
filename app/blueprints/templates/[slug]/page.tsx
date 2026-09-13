import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import prisma from "@/lib/db";
import { getMemberStatus } from "@/lib/member";
import { jsonLd } from "@/lib/safe-markdown";
import { BLUEPRINT_ROLES, siteUrl, SITE_NAME } from "@/lib/site";
import { getRelatedTemplates, getTemplate, templateCategoryLabel } from "@/lib/templates";
import TemplateCard from "@/components/TemplateCard";
import TemplateDownload from "@/components/template/TemplateDownload";
import { AlertTriangle, CheckCircle, ChevronRight, ListChecks, UserCheck } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const template = getTemplate(slug);
  if (!template) return {};
  const title = `${template.title} · Workflow Template · ${SITE_NAME}`;
  const url = siteUrl(`/blueprints/templates/${slug}`);
  return {
    title,
    description: template.summary,
    alternates: { canonical: url },
    openGraph: { title, description: template.summary, url, type: "article" },
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="font-serif text-2xl font-bold text-ink">{title}</h2>
      <div className="mt-3 text-[15px] leading-relaxed text-ink/85">{children}</div>
    </section>
  );
}

function IconList({ items, icon: Icon }: { items: string[]; icon: typeof CheckCircle }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <Icon className="mt-1 h-4 w-4 shrink-0 text-accent" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function TemplateDetailPage({ params }: Props) {
  const { slug } = await params;
  const template = getTemplate(slug);
  if (!template) notFound();

  const member = await getMemberStatus();
  const related = getRelatedTemplates(template, 3);
  const categoryLabel = templateCategoryLabel(template.category);
  const roleLabels = template.roles.map(
    (role) => BLUEPRINT_ROLES.find((r) => r.slug === role)?.label ?? role,
  );

  let guides: { slug: string; title: string }[] = [];
  if (template.blueprints.length > 0) {
    try {
      guides = await prisma.blueprint.findMany({
        where: { slug: { in: template.blueprints }, isPublished: true },
        select: { slug: true, title: true },
      });
    } catch (err) {
      console.warn("Could not load blueprints for template:", err);
    }
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Blueprints", item: siteUrl("/blueprints") },
      {
        "@type": "ListItem",
        position: 2,
        name: "Workflow Templates",
        item: siteUrl("/blueprints/templates"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: template.title,
        item: siteUrl(`/blueprints/templates/${template.slug}`),
      },
    ],
  };

  return (
    <div className="w-full bg-paper pt-8 pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumbs" className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-ink/60">
          <Link href="/blueprints" className="hover:text-ink">
            Blueprints
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/blueprints/templates" className="hover:text-ink">
            Workflow Templates
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link
            href={`/blueprints/templates?category=${template.category}`}
            className="font-medium text-ink/80 hover:text-ink"
          >
            {categoryLabel}
          </Link>
        </nav>

        <div className="max-w-4xl border-b border-rule pb-8">
          <span className="rounded bg-ink px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-paper">
            {categoryLabel}
          </span>
          <h1 className="mt-4 font-serif text-3xl font-bold leading-[1.15] tracking-tight text-ink sm:text-4xl lg:text-5xl">
            {template.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-ink/80 sm:text-lg">{template.summary}</p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <Section title="The Problem">
              <p>{template.problem}</p>
            </Section>

            <Section title="How This Template Solves It">
              <p>{template.useCase}</p>
            </Section>

            <Section title="How It Works">
              <ol className="space-y-3">
                {template.howItWorks.map((step, idx) => (
                  <li key={step} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-rule bg-surface font-mono text-[11px] font-semibold text-ink/70">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </Section>

            <Section title="What You Need">
              <IconList items={template.youNeed} icon={ListChecks} />
            </Section>

            <Section title="What Stays Under Your Control">
              <IconList items={template.staysManual} icon={UserCheck} />
            </Section>

            <Section title="Watch Out For">
              <IconList items={template.watchOuts} icon={AlertTriangle} />
            </Section>

            {guides.length > 0 && (
              <Section title="Step-by-Step Blueprint">
                <p>This template is the starting point for a full guide with setup steps and prompts:</p>
                <ul className="mt-3 space-y-2">
                  {guides.map((guide) => (
                    <li key={guide.slug}>
                      <Link
                        href={`/blueprints/${guide.slug}`}
                        className="font-medium text-ink underline hover:text-accent"
                      >
                        {guide.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <p className="mt-12 border-t border-rule pt-6 text-xs leading-relaxed text-ink/60">
              Adapted from a community workflow template. Before publishing we removed credentials,
              account and file IDs, email addresses and sample data. The original author&apos;s setup
              notes are kept inside the workflow file.
            </p>
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-20 space-y-6">
              <div className="rounded-[2px] border border-rule bg-surface p-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink/70">Get the Template</h3>
                <div className="mt-4">
                  <TemplateDownload slug={template.slug} isMember={member.isMember} />
                </div>
              </div>

              <div className="rounded-[2px] border border-rule bg-surface p-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink/70">At a Glance</h3>
                <dl className="mt-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-ink/60">Runs on</dt>
                    <dd className="font-semibold text-ink">n8n</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4 border-t border-rule pt-3">
                    <dt className="text-ink/60">Starts on</dt>
                    <dd className="text-right font-semibold text-ink">{template.triggers.join(", ")}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-rule pt-3">
                    <dt className="text-ink/60">Workflow steps</dt>
                    <dd className="font-semibold text-ink">{template.facts.nodeCount} nodes</dd>
                  </div>
                  <div className="border-t border-rule pt-3">
                    <dt className="text-ink/60">Best for</dt>
                    <dd className="mt-1 font-semibold text-ink">{roleLabels.join(", ")}</dd>
                  </div>
                  {template.apps.length > 0 && (
                    <div className="border-t border-rule pt-3">
                      <dt className="text-ink/60">Connected apps in the file</dt>
                      <dd className="mt-1.5 flex flex-wrap gap-1.5">
                        {template.apps.map((app) => (
                          <span
                            key={app}
                            className="rounded border border-rule bg-paper px-2 py-0.5 font-mono text-[11px] text-ink/80"
                          >
                            {app}
                          </span>
                        ))}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="rounded-[2px] border border-rule bg-paper p-6 text-xs text-ink/75">
                <p className="font-semibold text-ink">Want this running for your team?</p>
                <p className="mt-1">We can adapt this workflow to your tools and data.</p>
                <Link href="/contact" className="mt-3 inline-flex font-semibold text-accent hover:underline">
                  Talk to Us
                </Link>
              </div>
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-20 border-t border-rule pt-12">
            <h2 className="font-serif text-2xl font-bold text-ink">More {categoryLabel} Templates</h2>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((t) => (
                <TemplateCard key={t.slug} template={t} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

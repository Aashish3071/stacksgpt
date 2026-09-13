import Link from "next/link";
import type { Metadata } from "next";
import TemplateCard from "@/components/TemplateCard";
import LibraryTabs from "@/components/blueprint/LibraryTabs";
import { listTemplates, TEMPLATE_CATEGORIES } from "@/lib/templates";
import { siteUrl, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Workflow Templates · ${SITE_NAME}`,
  description:
    "Downloadable AI workflow templates for sales, support, marketing, research, documents and HR. Each template explains the problem it solves and how it works.",
  alternates: { canonical: siteUrl("/blueprints/templates") },
};

interface SearchParams {
  category?: string;
}

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { category } = await searchParams;
  const activeCategory = TEMPLATE_CATEGORIES.find((c) => c.slug === category);
  const allTemplates = listTemplates();
  const visibleCategories = activeCategory ? [activeCategory] : TEMPLATE_CATEGORIES;

  return (
    <div className="w-full bg-paper pt-8 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="border-b border-rule pb-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">
            Workflows &amp; Templates
          </span>
          <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Workflow Templates
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/75 sm:text-base">
            Ready-made automations you can import and adapt. Every template explains the problem it
            solves, how it works, what you need and what stays in your hands.
          </p>

          <LibraryTabs active="templates" />

          <div className="mt-8 flex flex-wrap items-center gap-2 border-b border-rule/70 pb-5">
            <Link
              href="/blueprints/templates"
              className={`rounded-[2px] px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                !activeCategory
                  ? "bg-ink text-paper shadow-sm"
                  : "border border-rule bg-surface text-ink/70 hover:border-ink/30 hover:text-ink"
              }`}
            >
              All Templates ({allTemplates.length})
            </Link>
            {TEMPLATE_CATEGORIES.map((cat) => {
              const isActive = activeCategory?.slug === cat.slug;
              return (
                <Link
                  key={cat.slug}
                  href={`/blueprints/templates?category=${cat.slug}`}
                  className={`rounded-[2px] px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                    isActive
                      ? "bg-ink text-paper shadow-sm"
                      : "border border-rule bg-surface text-ink/70 hover:border-ink/30 hover:text-ink"
                  }`}
                >
                  {cat.label} ({listTemplates(cat.slug).length})
                </Link>
              );
            })}
          </div>
        </div>

        {visibleCategories.map((cat) => {
          const templates = listTemplates(cat.slug);
          if (templates.length === 0) return null;
          return (
            <section key={cat.slug} className="mt-10" aria-labelledby={`cat-${cat.slug}`}>
              <div className="flex flex-wrap items-end justify-between gap-2 border-b border-rule pb-3">
                <div>
                  <h2 id={`cat-${cat.slug}`} className="font-serif text-2xl font-bold text-ink">
                    {cat.label}
                  </h2>
                  <p className="mt-1 text-xs text-ink/70">{cat.description}</p>
                </div>
                {!activeCategory && (
                  <Link
                    href={`/blueprints/templates?category=${cat.slug}`}
                    className="text-xs font-medium text-accent hover:underline"
                  >
                    View only {cat.label}
                  </Link>
                )}
              </div>
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                  <TemplateCard key={template.slug} template={template} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

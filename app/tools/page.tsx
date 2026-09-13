import type { Metadata } from "next";
import prisma from "@/lib/db";
import AffiliateToolCard from "@/components/AffiliateToolCard";
import { siteUrl } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "AI tools directory",
  description:
    "A curated technical index of modern AI tools: core capabilities, practical use cases, and transparent pricing models.",
  alternates: { canonical: siteUrl("/tools") },
};

export default async function ToolsDirectoryPage() {
  let tools: any[] = [];
  let approved: { url: string }[] = [];
  try {
    tools = await prisma.toolAffiliate.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    approved = await prisma.partnerLink.findMany({
      where: { active: true, partner: { active: true } },
      select: { url: true },
    });
  } catch (err) {
    console.warn("Could not query tools or partners during build/render:", err);
  }

  tools = tools.map((t) =>
    approved.some((p) => p.url === t.affiliateUrl)
      ? t
      : { ...t, affiliateUrl: null, status: "NONE" },
  );
  // Group into sections so the page reads as a reference, not a shop.
  const byCategory = tools.reduce<Record<string, typeof tools>>((acc, tool) => {
    (acc[tool.category] ||= []).push(tool);
    return acc;
  }, {});

  const categories = Object.keys(byCategory).sort();

  return (
    <div className="mx-auto max-w-shell px-4 py-10 sm:px-6">
      <header className="border-b border-rule pb-8">
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-accent">
          Reference Index
        </span>
        <h1 className="mt-2 font-serif text-head-lg sm:text-4xl font-semibold text-ink">
          AI Tools &amp; Frameworks Directory
        </h1>
        <p className="mt-3 max-w-2xl font-serif text-dek text-muted">
          A technical index of verified AI software, local model runners, autonomous agents, and automation frameworks.
        </p>
        <p className="meta mt-4 leading-relaxed max-w-3xl">
          Entries are listed by capability domain with verified pricing models, license structures, and direct links to official documentation. We do not accept sponsored rankings or affiliate placement fees.
        </p>

        {/* Category Jump Pills */}
        <div className="mt-6 flex flex-wrap items-center gap-2 pt-2">
          {categories.map((category) => {
            const anchor = category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            return (
              <a
                key={category}
                href={`#${anchor}`}
                className="rounded-[2px] border border-rule bg-surface px-3 py-1 text-xs font-medium text-ink/75 transition hover:border-ink/40 hover:text-ink"
              >
                {category} ({byCategory[category].length})
              </a>
            );
          })}
        </div>
      </header>

      {categories.length === 0 ? (
        <p className="meta py-16 text-center">No tools listed yet.</p>
      ) : (
        <div className="space-y-12 pt-8">
          {categories.map((category) => {
            const anchor = category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            return (
              <section
                key={category}
                id={anchor}
                className="border-b border-rule pb-10 scroll-mt-20 last:border-b-0"
              >
                <div className="flex items-center justify-between border-b border-rule pb-3">
                  <h2 className="font-serif text-xl font-semibold text-ink">
                    {category}
                  </h2>
                  <span className="font-mono text-xs text-muted">
                    {byCategory[category].length} {byCategory[category].length === 1 ? "tool" : "tools"}
                  </span>
                </div>
                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {byCategory[category].map((tool) => (
                    <AffiliateToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

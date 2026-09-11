import type { Metadata } from "next";
import prisma from "@/lib/db";
import AffiliateToolCard from "@/components/AffiliateToolCard";
import { siteUrl } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "AI tools directory",
  description:
    "A plain-English reference to the AI tools we write about: what each one does, who it suits, and what it costs.",
  alternates: { canonical: siteUrl("/tools") },
};

export default async function ToolsDirectoryPage() {
  let tools: any[] = [];
  try {
    tools = await prisma.toolAffiliate.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
  } catch (err) {
    console.warn("Could not query tools during build/render:", err);
  }

  const approved = await prisma.partnerLink.findMany({
    where: { active: true, partner: { active: true } },
    select: { url: true },
  });
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
      <header className="max-w-measure-wide border-b border-rule pb-6">
        <h1 className="font-serif text-head-lg font-semibold text-ink">
          AI tools directory
        </h1>
        <p className="mt-3 font-serif text-dek text-muted">
          A reference to the tools that come up in our reporting — what each one
          does, who it suits, and what it costs.
        </p>
        <p className="meta mt-4 leading-relaxed">
          Entries are listed alphabetically within each section. We do not rank
          them, score them, or accept payment for inclusion. Where a link is a
          partner link, it is labelled as one on the entry itself.
        </p>
      </header>

      {categories.length === 0 ? (
        <p className="meta py-16 text-center">No tools listed yet.</p>
      ) : (
        categories.map((category) => (
          <section
            key={category}
            className="border-t border-rule py-6 first:border-t-0"
          >
            <h2 className="kicker border-b border-rule pb-2">{category}</h2>
            <div className="grid gap-x-8 divide-y divide-rule sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-3">
              {byCategory[category].map((tool) => (
                <AffiliateToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

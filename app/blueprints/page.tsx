import Link from "next/link";
import type { Metadata } from "next";
import prisma from "@/lib/db";
import { getMemberStatus } from "@/lib/member";
import BlueprintCard, { BlueprintCardData } from "@/components/BlueprintCard";
import LibraryTabs from "@/components/blueprint/LibraryTabs";
import NewsletterCard from "@/components/NewsletterCard";
import { BLUEPRINT_GOALS, siteUrl, SITE_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `AI Blueprints · ${SITE_NAME}`,
  description:
    "Plain-English guides for putting AI to work: get more leads, handle email, make content, research competitors and automate operations. Free step-by-step setups.",
  alternates: { canonical: siteUrl("/blueprints") },
};

export default async function BlueprintsPage({
  searchParams,
}: {
  searchParams: Promise<{ goal?: string }>;
}) {
  const { goal } = await searchParams;
  const activeGoal = BLUEPRINT_GOALS.find((g) => g.slug === goal);
  const member = await getMemberStatus();

  let allBlueprints: BlueprintCardData[] = [];
  try {
    allBlueprints = await prisma.blueprint.findMany({
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
  } catch (err) {
    console.error("Failed to load blueprints:", err);
  }

  const counts = new Map<string, number>();
  for (const bp of allBlueprints) counts.set(bp.goal, (counts.get(bp.goal) ?? 0) + 1);
  const goalsWithBlueprints = BLUEPRINT_GOALS.filter((g) => counts.has(g.slug));
  const blueprints = activeGoal
    ? allBlueprints.filter((bp) => bp.goal === activeGoal.slug)
    : allBlueprints;

  const tabClass = (isActive: boolean) =>
    `rounded-full px-4 py-2 text-sm font-medium transition ${
      isActive
        ? "bg-ink text-paper"
        : "border border-rule bg-surface text-ink/75 hover:border-ink/30 hover:text-ink"
    }`;

  return (
    <div className="w-full bg-paper pt-8">
      <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <header className="max-w-3xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">Free AI guides</span>
          <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            AI Blueprints
          </h1>
          <p className="mt-3 text-base leading-relaxed text-ink/75 sm:text-lg">
            Plain-English guides for putting AI to work in your business. Each one explains the problem,
            what you get and how it works, with a free step-by-step setup.
          </p>
          <LibraryTabs active="blueprints" />
        </header>

        <nav aria-label="Filter by goal" className="mt-10 flex flex-wrap gap-2">
          <Link href="/blueprints" className={tabClass(!activeGoal)}>
            All
          </Link>
          {goalsWithBlueprints.map((g) => (
            <Link key={g.slug} href={`/blueprints?goal=${g.slug}`} className={tabClass(activeGoal?.slug === g.slug)}>
              {g.label}
            </Link>
          ))}
        </nav>

        {blueprints.length === 0 ? (
          <div className="my-16 rounded-[2px] border border-dashed border-rule bg-surface p-12 text-center">
            <h2 className="font-serif text-lg font-bold text-ink">No blueprints here yet</h2>
            <p className="mt-2 text-sm text-ink/60">New guides are added regularly.</p>
            <Link
              href="/blueprints"
              className="mt-5 inline-flex rounded-[2px] bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-ink/90"
            >
              See all blueprints
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {blueprints.map((bp) => (
              <BlueprintCard key={bp.id} blueprint={bp} isUnlocked={member.isMember} />
            ))}
          </div>
        )}
      </div>

      <section className="border-t border-rule bg-surface py-10">
        <div className="mx-auto max-w-3xl px-4">
          <NewsletterCard />
        </div>
      </section>
    </div>
  );
}

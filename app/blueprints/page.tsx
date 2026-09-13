import Link from "next/link";
import type { Metadata } from "next";
import prisma from "@/lib/db";
import { getMemberStatus } from "@/lib/member";
import BlueprintCard, { BlueprintCardData } from "@/components/BlueprintCard";
import {
  BLUEPRINT_CATEGORIES,
  BLUEPRINT_GOALS,
  BLUEPRINT_DIFFICULTIES,
  BLUEPRINT_SETUP_TIMES,
  siteUrl,
  SITE_NAME,
} from "@/lib/site";
import { SlidersHorizontal, X } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `AI Blueprints Library · ${SITE_NAME}`,
  description:
    "Actionable, step-by-step blueprints for Automation, AI Agents, and AI Workflows. Triage email, automate lead scoring, produce content, and ship products.",
  alternates: { canonical: siteUrl("/blueprints") },
};

interface SearchParams {
  category?: string;
  goal?: string;
  role?: string;
  tool?: string;
  difficulty?: string;
  setupTime?: string;
  sort?: string;
}

export default async function BlueprintsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const member = await getMemberStatus();

  const activeCategory = params.category?.toLowerCase();

  const whereClause: any = {
    isPublished: true,
  };

  // Filter by Category
  if (activeCategory) {
    if (activeCategory === "automation") {
      whereClause.OR = [
        { category: { equals: "Automation", mode: "insensitive" } },
        { goal: { contains: "automate" } },
        { tools: { hasSome: ["n8n", "zapier", "make"] } },
      ];
    } else if (activeCategory === "ai-agents") {
      whereClause.OR = [
        { category: { equals: "AI Agents", mode: "insensitive" } },
        { tools: { hasSome: ["hermes", "claude-code", "agent"] } },
        { title: { contains: "Agent", mode: "insensitive" } },
      ];
    } else if (activeCategory === "telegram") {
      whereClause.OR = [
        { tools: { has: "telegram" } },
        { title: { contains: "Telegram", mode: "insensitive" } },
        { category: { equals: "Telegram", mode: "insensitive" } },
      ];
    } else if (activeCategory === "slack") {
      whereClause.OR = [
        { tools: { has: "slack" } },
        { title: { contains: "Slack", mode: "insensitive" } },
        { category: { equals: "Slack", mode: "insensitive" } },
      ];
    } else if (activeCategory === "marketing" || activeCategory === "social-media") {
      whereClause.OR = [
        { category: { in: ["Marketing", "Social Media", "Social Media Marketing"], mode: "insensitive" } },
        { goal: { in: ["make-content", "run-ads"] } },
        { roles: { has: "marketer" } },
      ];
    } else if (activeCategory === "sales" || activeCategory === "b2b" || activeCategory === "gtm") {
      whereClause.OR = [
        { category: { in: ["Sales", "B2B", "GTM"], mode: "insensitive" } },
        { goal: { in: ["get-more-leads", "ship-a-product"] } },
        { roles: { hasSome: ["sales", "founder"] } },
      ];
    } else {
      whereClause.category = { equals: activeCategory, mode: "insensitive" };
    }
  }

  if (params.goal) {
    whereClause.goal = params.goal;
  }
  if (params.difficulty) {
    whereClause.difficulty = params.difficulty;
  }
  if (params.setupTime) {
    whereClause.setupTime = params.setupTime;
  }
  if (params.role) {
    whereClause.roles = { has: params.role };
  }
  if (params.tool) {
    whereClause.tools = { has: params.tool.toLowerCase() };
  }

  let orderBy: any = { publishedAt: "desc" };
  if (params.sort === "quickest") {
    orderBy = { setupTime: "asc" };
  }

  let blueprints: BlueprintCardData[] = [];
  try {
    blueprints = (await prisma.blueprint.findMany({
      where: whereClause,
      orderBy,
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        outcome: true,
        goal: true,
        category: true,
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
    console.error("Failed to load blueprints:", err);
  }

  // Dynamically compute categories that have at least one active published blueprint
  const availableCategoryMap = new Map<string, string>();
  try {
    const allPublished = await prisma.blueprint.findMany({
      where: { isPublished: true },
      select: { category: true },
    });
    for (const b of allPublished) {
      const catStr = (b.category || "Automation").trim();
      const matched = BLUEPRINT_CATEGORIES.find(
        (c) =>
          c.slug.toLowerCase() === catStr.toLowerCase() ||
          c.label.toLowerCase() === catStr.toLowerCase(),
      );
      const slug = matched ? matched.slug : catStr.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const label = matched ? matched.label : catStr;
      availableCategoryMap.set(slug, label);
    }
  } catch (err) {
    console.warn("Could not query published blueprint categories:", err);
  }

  const availableCategories = Array.from(availableCategoryMap.entries())
    .map(([slug, label]) => ({ slug, label }))
    .sort((a, b) => {
      const idxA = BLUEPRINT_CATEGORIES.findIndex((c) => c.slug === a.slug);
      const idxB = BLUEPRINT_CATEGORIES.findIndex((c) => c.slug === b.slug);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.label.localeCompare(b.label);
    });

  // Helper function to build filter query string
  function filterHref(overrides: Partial<SearchParams>) {
    const next = { ...params, ...overrides };
    const query = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => {
      if (v) query.set(k, v);
    });
    const qs = query.toString();
    return `/blueprints${qs ? `?${qs}` : ""}`;
  }

  const hasSubFilters = Boolean(
    params.goal || params.role || params.tool || params.difficulty || params.setupTime,
  );

  return (
    <div className="w-full bg-paper pt-8 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="border-b border-rule pb-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">
            Workflows &amp; Templates
          </span>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink">
            AI Blueprints &amp; Automation
          </h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base leading-relaxed text-ink/75">
            Production-grade playbooks, agent architectures, and automation templates.
            Every blueprint includes prerequisites, directory structure, templates, and copy-paste prompts.
          </p>

          {/* 1. Primary Category Tabs (Only categories with published blueprints) */}
          <div className="mt-8 flex flex-wrap items-center gap-2 border-b border-rule/70 pb-5">
            <Link
              href={filterHref({ category: undefined })}
              className={`rounded-[2px] px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                !activeCategory
                  ? "bg-ink text-paper shadow-sm"
                  : "bg-surface border border-rule text-ink/70 hover:border-ink/30 hover:text-ink"
              }`}
            >
              All Workflows
            </Link>
            {availableCategories.map((cat) => {
              const isActive = activeCategory === cat.slug;
              return (
                <Link
                  key={cat.slug}
                  href={filterHref({ category: cat.slug })}
                  className={`rounded-[2px] px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                    isActive
                      ? "bg-ink text-paper shadow-sm"
                      : "bg-surface border border-rule text-ink/70 hover:border-ink/30 hover:text-ink"
                  }`}
                >
                  {cat.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Filter Controls & Sort Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-4 text-xs">
          <div className="flex flex-wrap items-center gap-2 text-ink/70">
            <span>
              Showing <strong className="text-ink">{blueprints.length}</strong>{" "}
              {blueprints.length === 1 ? "blueprint" : "blueprints"}
            </span>

            {/* Active Filter Chips */}
            {params.goal && (
              <Link
                href={filterHref({ goal: undefined })}
                className="inline-flex items-center gap-1 rounded bg-rule px-2 py-0.5 text-[11px] font-medium text-ink hover:bg-rule/80"
              >
                <span>Goal: {params.goal.replace(/-/g, " ")}</span>
                <X className="h-3 w-3" />
              </Link>
            )}
            {params.difficulty && (
              <Link
                href={filterHref({ difficulty: undefined })}
                className="inline-flex items-center gap-1 rounded bg-rule px-2 py-0.5 text-[11px] font-medium text-ink hover:bg-rule/80"
              >
                <span>Difficulty: {params.difficulty}</span>
                <X className="h-3 w-3" />
              </Link>
            )}
            {params.setupTime && (
              <Link
                href={filterHref({ setupTime: undefined })}
                className="inline-flex items-center gap-1 rounded bg-rule px-2 py-0.5 text-[11px] font-medium text-ink hover:bg-rule/80"
              >
                <span>Time: {params.setupTime}</span>
                <X className="h-3 w-3" />
              </Link>
            )}

            {(hasSubFilters || activeCategory) && (
              <Link
                href="/blueprints"
                className="ml-2 font-medium text-accent hover:underline"
              >
                Clear all filters
              </Link>
            )}
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-3">
            <span className="text-ink/60">Sort:</span>
            <Link
              href={filterHref({ sort: undefined })}
              className={`font-medium ${
                params.sort !== "quickest" ? "text-ink underline" : "text-ink/60 hover:text-ink"
              }`}
            >
              Newest
            </Link>
            <Link
              href={filterHref({ sort: "quickest" })}
              className={`font-medium ${
                params.sort === "quickest" ? "text-ink underline" : "text-ink/60 hover:text-ink"
              }`}
            >
              Quickest setup
            </Link>
          </div>
        </div>

        {/* Results Grid */}
        <div className="mt-8">
          {blueprints.length === 0 ? (
            <div className="my-16 rounded-[2px] border border-dashed border-rule bg-surface p-12 text-center">
              <SlidersHorizontal className="mx-auto h-8 w-8 text-ink/30 mb-3" />
              <h3 className="font-serif text-lg font-bold text-ink">
                No blueprints match your filter criteria
              </h3>
              <p className="mt-2 text-xs text-ink/60 max-w-sm mx-auto">
                Try selecting a different category or clearing active filters to browse all available workflows.
              </p>
              <div className="mt-5">
                <Link
                  href="/blueprints"
                  className="inline-flex rounded-[2px] bg-ink px-4 py-2 text-xs font-semibold text-paper hover:bg-ink/90 transition"
                >
                  Reset all filters
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {blueprints.map((bp) => (
                <BlueprintCard
                  key={bp.id}
                  blueprint={bp}
                  isUnlocked={member.isMember}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

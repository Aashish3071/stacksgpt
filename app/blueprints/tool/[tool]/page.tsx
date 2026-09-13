import type { Metadata } from "next";
import prisma from "@/lib/db";
import { getMemberStatus } from "@/lib/member";
import BlueprintCard, { BlueprintCardData } from "@/components/BlueprintCard";
import { siteUrl, SITE_NAME } from "@/lib/site";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Props {
  params: Promise<{ tool: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tool } = await params;
  const toolName = tool.charAt(0).toUpperCase() + tool.slice(1);
  return {
    title: `${toolName} AI Blueprints · ${SITE_NAME}`,
    description: `Step-by-step blueprints, prompts, and templates that use ${toolName}.`,
    alternates: { canonical: siteUrl(`/blueprints/tool/${tool}`) },
  };
}

export default async function ToolBlueprintsPage({ params }: Props) {
  const { tool } = await params;
  const toolSlug = tool.toLowerCase();
  const toolDisplayName = tool.charAt(0).toUpperCase() + tool.slice(1);
  const member = await getMemberStatus();

  let blueprints: BlueprintCardData[] = [];
  try {
    blueprints = (await prisma.blueprint.findMany({
      where: {
        isPublished: true,
        tools: { has: toolSlug },
      },
      orderBy: { publishedAt: "desc" },
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
    console.error("Failed to load tool blueprints:", err);
  }

  return (
    <div className="w-full bg-paper pt-8 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumbs" className="mb-6 flex items-center gap-1.5 text-xs text-ink/60">
          <Link href="/blueprints" className="hover:text-ink">
            Blueprints
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-ink font-medium capitalize">{toolDisplayName}</span>
        </nav>

        <div className="border-b border-rule pb-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">
            Tool Workflows
          </span>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            {toolDisplayName} Blueprints
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/75">
            Step-by-step implementation playbooks and starter prompts powered by {toolDisplayName}.
          </p>
        </div>

        <div className="mt-8">
          {blueprints.length === 0 ? (
            <div className="my-16 rounded-[2px] border border-dashed border-rule bg-surface p-12 text-center">
              <h3 className="font-serif text-lg font-bold text-ink">
                No blueprints found for {toolDisplayName} yet
              </h3>
              <p className="mt-2 text-xs text-ink/60">
                Check back soon or browse all available workflows in the library.
              </p>
              <div className="mt-4">
                <Link
                  href="/blueprints"
                  className="inline-flex rounded-[2px] bg-ink px-4 py-2 text-xs font-semibold text-paper hover:bg-ink/90 transition"
                >
                  Explore all blueprints
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

import prisma from "./db";

/**
 * Tool matching.
 *
 * This module used to invent a tool entry whenever the model named something
 * unfamiliar — guessing a website (`https://<name>.ai`), a referral URL
 * (`?ref=aipulse`, an account nobody owns) and a discount code that no vendor
 * would honour. All of it was rendered to readers as a real offer.
 *
 * It now only ever *looks up* tools that a human entered. No match means no
 * tool block on the article, which is the correct outcome.
 */

export interface AffiliateMatchResult {
  toolId: string;
  name: string;
  slug: string;
  websiteUrl: string;
  affiliateUrl: string | null;
  /** "ACTIVE" only when a real, approved partner link has been entered. */
  status: string;
}

export function slugifyToolName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Finds a registered tool by slug, name or a recorded alias.
 * Returns null when the tool is not in the registry — callers must handle that
 * by rendering no commercial link at all.
 */
export async function matchAffiliateTool(
  toolName: string,
  _category?: string
): Promise<AffiliateMatchResult | null> {
  if (!toolName || !toolName.trim()) return null;

  const slug = slugifyToolName(toolName);
  if (!slug) return null;

  const tool =
    (await prisma.toolAffiliate.findUnique({ where: { slug } })) ??
    (await prisma.toolAffiliate.findFirst({
      where: { name: { equals: toolName.trim() } },
    }));

  if (tool) return toResult(tool);

  // Alias lookup: aliases are stored as a JSON array of lowercase strings.
  const needle = toolName.trim().toLowerCase();
  const candidates = await prisma.toolAffiliate.findMany({
    where: { NOT: { aliases: null } },
  });

  for (const candidate of candidates) {
    let aliases: string[] = [];
    try {
      const parsed = JSON.parse(candidate.aliases || "[]");
      aliases = Array.isArray(parsed) ? parsed.map((a: unknown) => String(a).toLowerCase()) : [];
    } catch {
      aliases = [];
    }
    if (aliases.includes(needle)) return toResult(candidate);
  }

  return null;
}

function toResult(tool: {
  id: string;
  name: string;
  slug: string;
  websiteUrl: string;
  affiliateUrl: string | null;
  status: string;
}): AffiliateMatchResult {
  return {
    toolId: tool.id,
    name: tool.name,
    slug: tool.slug,
    websiteUrl: tool.websiteUrl,
    affiliateUrl: tool.affiliateUrl,
    status: tool.status,
  };
}

/** True only for a hand-entered, approved partner link. */
export function isPartnerLink(tool: {
  affiliateUrl?: string | null;
  status?: string | null;
}): boolean {
  return Boolean(tool.affiliateUrl && tool.status === "ACTIVE");
}

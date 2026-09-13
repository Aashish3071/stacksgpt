/**
 * Single source of truth for site identity and absolute URLs.
 * Everything canonical (metadata, sitemap, feed, OG images) derives from here,
 * so pointing a new domain at the site is a one-line env change.
 */

export const SITE_NAME = "StacksGPT";
export const SITE_TAGLINE = "AI workflows you can actually run";

const FALLBACK_URL = "http://localhost:3000";

export function siteUrl(path = ""): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_URL).replace(
    /\/+$/,
    "",
  );
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Blueprint taxonomy definitions.
 * Central single source of truth for categories, goals, roles, difficulties, and setup times.
 */
export const BLUEPRINT_CATEGORIES = [
  { slug: "automation", label: "Automation" },
  { slug: "ai-agents", label: "AI Agents" },
  { slug: "marketing", label: "Marketing" },
  { slug: "sales", label: "Sales" },
  { slug: "gtm", label: "GTM" },
  { slug: "b2b", label: "B2B" },
  { slug: "social-media", label: "Social Media" },
  { slug: "telegram", label: "Telegram" },
  { slug: "slack", label: "Slack" },
] as const;

export type BlueprintCategorySlug = (typeof BLUEPRINT_CATEGORIES)[number]["slug"];

export function blueprintCategoryLabel(slug: string): string {
  const match = BLUEPRINT_CATEGORIES.find((c) => c.slug === slug.toLowerCase());
  return match ? match.label : slug.replace(/-/g, " ");
}

export const BLUEPRINT_GOALS = [
  { slug: "get-more-leads", label: "Get More Leads" },
  { slug: "manage-email-and-admin", label: "Manage Email & Admin" },
  { slug: "make-content", label: "Make Content" },
  { slug: "run-ads", label: "Run Ads" },
  { slug: "ship-a-product", label: "Ship a Product" },
  { slug: "research-and-analysis", label: "Research & Analysis" },
  { slug: "automate-operations", label: "Automate Operations" },
] as const;

export type BlueprintGoalSlug = (typeof BLUEPRINT_GOALS)[number]["slug"];

export const BLUEPRINT_ROLES = [
  { slug: "founder", label: "Founder" },
  { slug: "marketer", label: "Marketer" },
  { slug: "freelancer-agency", label: "Freelancer / Agency" },
  { slug: "sales", label: "Sales" },
  { slug: "operations", label: "Operations" },
  { slug: "developer", label: "Developer" },
] as const;

export type BlueprintRoleSlug = (typeof BLUEPRINT_ROLES)[number]["slug"];

export const BLUEPRINT_DIFFICULTIES = [
  { slug: "beginner", label: "Beginner" },
  { slug: "intermediate", label: "Intermediate" },
  { slug: "advanced", label: "Advanced" },
] as const;

export type BlueprintDifficulty = (typeof BLUEPRINT_DIFFICULTIES)[number]["slug"];

export const BLUEPRINT_SETUP_TIMES = [
  { slug: "under-1-hour", label: "Under 1 hour" },
  { slug: "half-day", label: "Half-day" },
  { slug: "weekend", label: "Weekend" },
] as const;

export type BlueprintSetupTime = (typeof BLUEPRINT_SETUP_TIMES)[number]["slug"];

export function blueprintGoalLabel(slug: string): string {
  const match = BLUEPRINT_GOALS.find((g) => g.slug === slug);
  return match ? match.label : slug.replace(/-/g, " ");
}

export function blueprintDifficultyLabel(slug: string): string {
  const match = BLUEPRINT_DIFFICULTIES.find((d) => d.slug === slug);
  return match ? match.label : slug;
}

export function blueprintSetupTimeLabel(slug: string): string {
  const match = BLUEPRINT_SETUP_TIMES.find((s) => s.slug === slug);
  return match ? match.label : slug;
}

/**
 * Story categories covering the entire AI and tech news spectrum.
 * This is a news publication, not a tutorial blog.
 */
export const ARTICLE_TYPES = {
  ANNOUNCEMENT: "Model Announcement",
  NEWS: "Tech News",
  UPDATE: "Update",
  TOOL: "Tool",
  USE_CASE: "AI Use Case",
  SHOWCASE: "Showcase",
} as const;

export type ArticleType = keyof typeof ARTICLE_TYPES;

export const ARTICLE_TYPE_KEYS = Object.keys(ARTICLE_TYPES) as ArticleType[];

/** All story types are news-focused reported pieces. */
export const REPORTING_TYPES: ArticleType[] = [
  "ANNOUNCEMENT",
  "NEWS",
  "UPDATE",
  "TOOL",
  "USE_CASE",
  "SHOWCASE",
];

export const PRACTICAL_TYPES: ArticleType[] = [];

/** Section heading for the closing take / significance. */
export function verdictLabel(type: string): string {
  if (type === "TOOL") return "Is it worth it?";
  return "Why it matters";
}

/** Section heading for the pointer summary. */
export function keyPointsLabel(type: string): string {
  return "What's new";
}

export const CATEGORIES = [
  "Productivity",
  "Coding",
  "Research",
  "Design",
  "Writing",
  "Automation",
] as const;

/**
 * Dateline format used across the site: "10 Sep 2026".
 *
 * The timezone is pinned to UTC deliberately. Without it the server formats in
 * the host's zone and the browser re-formats in the reader's, which produces a
 * different day either side of midnight — a React hydration mismatch on every
 * article page for anyone not in the server's timezone.
 */
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Machine-readable date for <time dateTime> and structured data. */
export function isoDate(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

export function categoryHref(category: string): string {
  return `/category/${encodeURIComponent(
    category
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),
  )}`;
}

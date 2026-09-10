/**
 * Single source of truth for site identity and absolute URLs.
 * Everything canonical (metadata, sitemap, feed, OG images) derives from here,
 * so pointing a new domain at the site is a one-line env change.
 */

export const SITE_NAME = "Stacksgpt";
export const SITE_TAGLINE = "AI & tech news in plain English";

const FALLBACK_URL = "http://localhost:3000";

export function siteUrl(path = ""): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_URL).replace(/\/+$/, "");
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
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
  "Writing",
  "Coding",
  "Research",
  "Design",
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
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
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
  return `/category/${encodeURIComponent(category.toLowerCase())}`;
}

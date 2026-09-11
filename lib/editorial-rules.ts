import { ARTICLE_TYPE_KEYS, CATEGORIES } from "./site";

/**
 * The single source of truth for what makes an article publishable.
 *
 * Two paths reach the site: MDX files committed by writing agents (parsed in
 * lib/content.ts) and records edited in the newsroom (checked in
 * lib/article-validation.ts). Both used to carry their own copy of these
 * thresholds, which is how they drift: one path would enforce a 60-character
 * SEO title while the other quietly allowed 70, and an article's validity would
 * depend on which door it came through.
 *
 * Rules live here. The two callers are thin adapters that shape their input and
 * add whatever is specific to their stage.
 */

export const LIMITS = {
  titleMin: 15,
  summaryMin: 40,
  verdictMin: 30,
  bodyWordsMin: 200,
  keyPointsMin: 2,
  keyPointsMax: 6,
  seoTitleMax: 60,
  seoTitleMin: 15,
  metaDescriptionMax: 160,
  metaDescriptionMin: 40,
  /** Below this the search snippet is padded by Google; advisory, not fatal. */
  metaDescriptionIdeal: 110,
  slugMax: 70,
  imageAltMin: 5,
  imageCreditMin: 3,
} as const;

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** House style: em dashes are not used anywhere a reader sees. */
export const EM_DASH = "—";

/** The shape both callers normalise to before the rules run. */
export interface RuleInput {
  title?: string | null;
  summary?: string | null;
  verdict?: string | null;
  body?: string | null;
  keyPoints?: string[] | null;
  slug?: string | null;
  type?: string | null;
  category?: string | null;
  seoTitle?: string | null;
  metaDescription?: string | null;
  sourceAuthor?: string | null;
  sourceUrl?: string | null;
  sourcePublishedAt?: Date | string | null;
  retrievedAt?: Date | string | null;
  heroImage?: string | null;
  heroImageAlt?: string | null;
  heroImageCredit?: string | null;
}

export interface RuleIssue {
  field: string;
  message: string;
  severity: "error" | "warning";
}

const text = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

function toDate(v: unknown): Date | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(String(v));
  return Number.isFinite(d.getTime()) ? d : null;
}

/** Counts words the way an editor would, not characters. */
export function wordCount(body: unknown): number {
  return text(body).split(/\s+/).filter(Boolean).length;
}

/**
 * Every editorial rule shared by both paths.
 *
 * Returns errors and warnings together; callers decide which of those block.
 * Nothing here touches the database or the filesystem, so it is trivially
 * testable and behaves identically wherever it runs.
 */
export function checkEditorialRules(a: RuleInput, now = new Date()): RuleIssue[] {
  const issues: RuleIssue[] = [];
  const err = (field: string, message: string) =>
    issues.push({ field, message, severity: "error" });
  const warn = (field: string, message: string) =>
    issues.push({ field, message, severity: "warning" });

  const title = text(a.title);
  const summary = text(a.summary);
  const verdict = text(a.verdict);
  const body = text(a.body);
  const keyPoints = Array.isArray(a.keyPoints) ? a.keyPoints.map(text).filter(Boolean) : [];

  // --- Core copy ---------------------------------------------------------
  if (title.length < LIMITS.titleMin)
    err("title", `Headline needs at least ${LIMITS.titleMin} characters.`);
  if (summary.length < LIMITS.summaryMin)
    err("summary", `Summary needs at least ${LIMITS.summaryMin} characters.`);
  if (verdict.length < LIMITS.verdictMin)
    err(
      "verdict",
      `"Why It Matters" needs at least ${LIMITS.verdictMin} characters.`,
    );

  const words = wordCount(body);
  if (words < LIMITS.bodyWordsMin)
    err(
      "body",
      `Article body needs at least ${LIMITS.bodyWordsMin} words of reported context. Got ${words}.`,
    );

  // --- House style -------------------------------------------------------
  const emDashIn = [
    ["title", title],
    ["summary", summary],
    ["verdict", verdict],
    ["body", body],
    ...keyPoints.map((k, i) => [`keyPoints[${i}]`, k] as [string, string]),
  ].filter(([, v]) => v.includes(EM_DASH));

  if (emDashIn.length > 0)
    err(
      "style",
      `Replace em dashes with a comma, colon or full stop. Found in: ${emDashIn
        .map(([f]) => f)
        .join(", ")}.`,
    );

  // --- Key points --------------------------------------------------------
  if (keyPoints.length < LIMITS.keyPointsMin || keyPoints.length > LIMITS.keyPointsMax)
    err(
      "keyPoints",
      `Add ${LIMITS.keyPointsMin} to ${LIMITS.keyPointsMax} key points. Readers scan these first.`,
    );

  // --- Taxonomy ----------------------------------------------------------
  if (!ARTICLE_TYPE_KEYS.includes(a.type as never))
    err("type", `Choose a story type: ${ARTICLE_TYPE_KEYS.join(", ")}.`);

  const category = text(a.category);
  if (!CATEGORIES.some((c) => c.toLowerCase() === category.toLowerCase()))
    err("category", `Category must be one of: ${CATEGORIES.join(", ")}.`);

  // --- Search ------------------------------------------------------------
  const seoTitle = text(a.seoTitle);
  if (seoTitle.length < LIMITS.seoTitleMin)
    err("seoTitle", `SEO title needs at least ${LIMITS.seoTitleMin} characters.`);
  if (seoTitle.length > LIMITS.seoTitleMax)
    err(
      "seoTitle",
      `SEO title is ${seoTitle.length} characters; Google truncates past ${LIMITS.seoTitleMax}.`,
    );

  const meta = text(a.metaDescription);
  if (meta.length < LIMITS.metaDescriptionMin)
    err(
      "metaDescription",
      `Meta description needs at least ${LIMITS.metaDescriptionMin} characters.`,
    );
  if (meta.length > LIMITS.metaDescriptionMax)
    err(
      "metaDescription",
      `Meta description is ${meta.length} characters; keep it under ${LIMITS.metaDescriptionMax}.`,
    );
  else if (meta.length && meta.length < LIMITS.metaDescriptionIdeal)
    warn(
      "metaDescription",
      `Meta description is ${meta.length} characters; ${LIMITS.metaDescriptionIdeal}-${LIMITS.metaDescriptionMax} fills the search snippet.`,
    );

  const slug = text(a.slug);
  if (!SLUG_PATTERN.test(slug) || slug.length > LIMITS.slugMax)
    err(
      "slug",
      `Use a lowercase hyphenated slug under ${LIMITS.slugMax + 1} characters.`,
    );

  // --- Attribution -------------------------------------------------------
  if (text(a.sourceAuthor).length < 2)
    err("sourceAuthor", "Name the publisher of the original source.");

  const sourceUrl = text(a.sourceUrl);
  if (!/^https:\/\//.test(sourceUrl)) {
    err("sourceUrl", "A primary HTTPS source URL is required.");
  } else {
    try {
      const u = new URL(sourceUrl);
      if (u.username || u.password)
        err("sourceUrl", "Source URLs cannot contain credentials.");
    } catch {
      err("sourceUrl", "Source URL is invalid.");
    }
  }

  // --- Timestamps --------------------------------------------------------
  const published = toDate(a.sourcePublishedAt);
  const retrieved = toDate(a.retrievedAt);

  if (!published) err("sourcePublishedAt", "Source publication date is required and must be valid.");
  else if (published > now) err("sourcePublishedAt", "Source publication date cannot be in the future.");

  if (!retrieved) err("retrievedAt", "Source retrieval timestamp is required and must be valid.");
  else if (retrieved > now) err("retrievedAt", "Source retrieval timestamp cannot be in the future.");

  if (published && retrieved && published > retrieved)
    err("retrievedAt", "Source retrieval cannot precede source publication.");

  // --- Imagery -----------------------------------------------------------
  if (!text(a.heroImage)) err("heroImage", "A relevant hero image is required.");
  if (text(a.heroImageAlt).length < LIMITS.imageAltMin)
    err("heroImageAlt", "Describe what is visible in the image for screen readers.");
  if (text(a.heroImageCredit).length < LIMITS.imageCreditMin)
    err("heroImageCredit", "Image credit is required.");

  return issues;
}

/** Convenience: just the blocking messages, in the shape callers already use. */
export function editorialErrors(a: RuleInput, now = new Date()): string[] {
  return checkEditorialRules(a, now)
    .filter((i) => i.severity === "error")
    .map((i) => i.message);
}

export function editorialWarnings(a: RuleInput, now = new Date()): RuleIssue[] {
  return checkEditorialRules(a, now).filter((i) => i.severity === "warning");
}

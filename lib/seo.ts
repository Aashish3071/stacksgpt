/**
 * SEO field derivation and validation.
 *
 * Search traffic is the entire growth model for an ad-funded site, so these
 * rules are enforced at build time rather than left to whoever writes the
 * article. Every rule here maps to something that actually affects how a page
 * appears in results.
 *
 * Note on `keywords`: Google has ignored the keywords meta tag since 2009. It
 * is emitted for other engines and internal grouping only — real keyword work
 * happens in the title, description, slug and headings, which is what the
 * validators below police.
 */

/** Google truncates titles near 60 characters on desktop. */
export const SEO_TITLE_MAX = 60;
/** Descriptions are truncated near 160; under 120 wastes the snippet. */
export const META_DESC_MIN = 110;
export const META_DESC_MAX = 160;
/** Long slugs get truncated in results and dilute the keyword signal. */
export const SLUG_MAX = 70;

const SLUG_STOPWORDS = new Set([
  "a", "an", "and", "the", "of", "to", "for", "on", "in", "is", "it", "its",
  "with", "your", "you", "that", "this", "what", "how", "why", "can", "now",
  "here", "just", "but", "or", "at", "by", "from", "be", "are", "was", "were",
]);

export interface SeoIssue {
  field: string;
  message: string;
  severity: "error" | "warning";
}

/** Trims to a length without cutting a word in half. */
export function truncateAtWord(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\-\s]+$/, "");
}

/**
 * A search-friendly slug: lowercase, hyphenated, readable, and capped in length.
 *
 * Stopwords are only stripped when the slug would otherwise exceed the cap.
 * Stripping them unconditionally produces urls like `heres-changes` and
 * `actually-lets-do`, which look broken to a human — and how a url reads in the
 * results page affects click-through more than keyword density in the slug does.
 */
export function optimiseSlug(input: string): string {
  const words = input
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const natural = joinWithin(words, SLUG_MAX);

  // Only if the natural slug had to be cut short do we drop stopwords to fit
  // more meaning into the same budget.
  if (natural.split("-").length < words.length) {
    const trimmed = words.filter((w) => !SLUG_STOPWORDS.has(w));
    if (trimmed.length >= 3) {
      const dense = joinWithin(trimmed, SLUG_MAX);
      if (dense.split("-").length > natural.split("-").length) return dense;
    }
  }

  return natural || "article";
}

/** Joins words with hyphens, stopping before the length cap. */
function joinWithin(words: string[], max: number): string {
  let out = "";
  for (const word of words) {
    const next = out ? `${out}-${word}` : word;
    if (next.length > max) break;
    out = next;
  }
  return out;
}

/** Normalises an author-supplied slug without rewording it. */
export function normaliseSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/, "");
}

export function deriveSeoTitle(explicit: string | undefined, headline: string): string {
  const chosen = (explicit || headline).trim();
  return truncateAtWord(chosen, SEO_TITLE_MAX);
}

export function deriveMetaDescription(explicit: string | undefined, summary: string): string {
  const chosen = (explicit || summary).trim();
  return truncateAtWord(chosen, META_DESC_MAX);
}

/** Normalises to lowercase, de-duplicated, 3–8 entries. */
export function normaliseKeywords(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  for (const raw of input) {
    const k = String(raw ?? "").trim().toLowerCase();
    if (k.length >= 3 && k.length <= 50) seen.add(k);
  }
  return Array.from(seen).slice(0, 8);
}

/**
 * Reports what would hurt this page in search results. Errors block the build;
 * warnings are advisory so an otherwise-good article is not rejected over a
 * two-character overshoot.
 */
export function auditSeo(input: {
  slug: string;
  seoTitle: string;
  metaDescription: string;
  keywords: string[];
  title: string;
}): SeoIssue[] {
  const issues: SeoIssue[] = [];

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) {
    issues.push({
      field: "slug",
      severity: "error",
      message: "Slug must be lowercase words separated by single hyphens.",
    });
  }
  if (input.slug.length > SLUG_MAX) {
    issues.push({
      field: "slug",
      severity: "error",
      message: `Slug is ${input.slug.length} characters; keep it under ${SLUG_MAX}.`,
    });
  }
  if (input.slug.split("-").length < 3) {
    issues.push({
      field: "slug",
      severity: "warning",
      message: "Slug is very short; three or more keywords rank better.",
    });
  }

  if (input.seoTitle.length > SEO_TITLE_MAX) {
    issues.push({
      field: "seoTitle",
      severity: "error",
      message: `seoTitle is ${input.seoTitle.length} characters; Google truncates past ${SEO_TITLE_MAX}.`,
    });
  }
  if (input.seoTitle.length < 25) {
    issues.push({
      field: "seoTitle",
      severity: "warning",
      message: "seoTitle is very short; you are giving away usable space.",
    });
  }

  if (input.metaDescription.length > META_DESC_MAX) {
    issues.push({
      field: "metaDescription",
      severity: "error",
      message: `metaDescription is ${input.metaDescription.length} characters; keep it under ${META_DESC_MAX}.`,
    });
  }
  if (input.metaDescription.length < META_DESC_MIN) {
    issues.push({
      field: "metaDescription",
      severity: "warning",
      message: `metaDescription is ${input.metaDescription.length} characters; aim for ${META_DESC_MIN}–${META_DESC_MAX} to fill the snippet.`,
    });
  }

  if (input.keywords.length < 3) {
    issues.push({
      field: "keywords",
      severity: "warning",
      message: "Fewer than 3 keywords. Used for internal grouping and related links.",
    });
  }

  return issues;
}

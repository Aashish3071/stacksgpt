import fs from "fs";
import path from "path";
import crypto from "crypto";
import matter from "gray-matter";
import {
  ARTICLE_TYPE_KEYS,
  ArticleType,
  CATEGORIES,
  PRACTICAL_TYPES,
  REPORTING_TYPES,
} from "./site";
import {
  auditSeo,
  deriveMetaDescription,
  deriveSeoTitle,
  normaliseKeywords,
  normaliseSlug,
  optimiseSlug,
  SeoIssue,
} from "./seo";

/**
 * Parsing and validation for articles committed to the repo as MDX.
 *
 * External agents write files into content/articles/. This module is the only
 * gate between what they write and what reaches the database, so it validates
 * strictly and reports every problem rather than silently importing a
 * half-formed article.
 */

export const CONTENT_DIR = path.join(process.cwd(), "content", "articles");
export const IMAGE_DIR = path.join(process.cwd(), "public", "images", "articles");

export interface JargonTerm {
  technicalTerm: string;
  plainEnglish: string;
}

export interface UseCase {
  title: string;
  targetAudience: string;
  stepByStep: string[];
  promptTemplate?: string;
}

export interface ParsedArticle {
  externalId: string;
  slug: string;
  type: ArticleType;
  keyPoints: string[];
  title: string;
  summary: string;
  category: string;
  verdict: string;
  jargonBuster: JargonTerm[];
  useCases: UseCase[];
  sourceName: string;
  sourceUrl: string;
  toolName?: string;
  heroImage?: string;
  heroImageAlt?: string;
  heroImageCredit?: string;
  sourcePublishedAt?: Date;
  retrievedAt?: Date;
  body: string;
  sourceHash: string;
  seoTitle: string;
  metaDescription: string;
  keywords: string[];
  seoWarnings: SeoIssue[];
}

export interface ParseFailure {
  file: string;
  errors: string[];
}

export type ParseResult =
  | { ok: true; article: ParsedArticle }
  | { ok: false; failure: ParseFailure };

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Validates one MDX file. Returns every problem at once, not just the first. */
export function parseArticleFile(filePath: string): ParseResult {
  const fileName = path.basename(filePath);
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const errors: string[] = [];

  const title = asString(data.title);
  const summary = asString(data.summary);
  const verdict = asString(data.verdict);
  const sourceUrl = asString(data.sourceUrl);
  const sourceName = asString(data.sourceName);
  const category = asString(data.category);

  if (title.length < 15) errors.push("`title` is required and must be at least 15 characters.");
  if (summary.length < 40) errors.push("`summary` is required and must be at least 40 characters.");
  if (verdict && verdict.length < 30) {
    errors.push("`verdict`, when present, must be at least 30 characters.");
  }
  if (!sourceName) errors.push("`sourceName` is required (who published the original).");

  // Attribution is non-negotiable: an article with no traceable source cannot
  // be published, and unverifiable claims are what fail ad-network review.
  if (!sourceUrl) {
    errors.push("`sourceUrl` is required — every article must link to its original source.");
  } else {
    try {
      const parsed = new URL(sourceUrl);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        errors.push("`sourceUrl` must be an http(s) URL.");
      }
    } catch {
      errors.push(`\`sourceUrl\` is not a valid URL: "${sourceUrl}"`);
    }
  }

  const matchedCategory = CATEGORIES.find((c) => c.toLowerCase() === category.toLowerCase());
  if (!matchedCategory) {
    errors.push(`\`category\` must be one of: ${CATEGORIES.join(", ")}. Got "${category}".`);
  }

  // Story type decides which sections are required below.
  const rawType = asString(data.type).toUpperCase().replace(/[\s-]+/g, "_");
  const type = ARTICLE_TYPE_KEYS.find((t) => t === rawType);
  if (!type) {
    errors.push(
      `\`type\` must be one of: ${ARTICLE_TYPE_KEYS.join(", ")}. Got "${asString(data.type)}".`
    );
  }

  const isReporting = type ? REPORTING_TYPES.includes(type) : false;
  const isPractical = type ? PRACTICAL_TYPES.includes(type) : false;

  // Key points: the scannable bullet pointers (What's new / key facts).
  const keyPoints: string[] = Array.isArray(data.keyPoints)
    ? data.keyPoints.map(asString).filter(Boolean)
    : [];

  if (keyPoints.length < 2) {
    errors.push(
      "`keyPoints` needs at least 2 bullet pointers — readers scan these first for what is new."
    );
  }
  if (keyPoints.length > 6) {
    errors.push("`keyPoints` should be at most 6; longer lists stop being scannable.");
  }

  // Jargon terms (optional legacy support)
  const jargonBuster: JargonTerm[] = [];
  if (Array.isArray(data.jargonBuster)) {
    data.jargonBuster.forEach((item: any, i: number) => {
      const technicalTerm = asString(item?.technicalTerm);
      const plainEnglish = asString(item?.plainEnglish);
      if (technicalTerm && plainEnglish) {
        jargonBuster.push({ technicalTerm, plainEnglish });
      }
    });
  }

  // Use cases (optional legacy support)
  const useCases: UseCase[] = [];
  if (Array.isArray(data.useCases)) {
    data.useCases.forEach((item: any) => {
      const ucTitle = asString(item?.title);
      const audience = asString(item?.targetAudience);
      const steps = Array.isArray(item?.stepByStep)
        ? item.stepByStep.map(asString).filter(Boolean)
        : [];
      if (ucTitle && audience && steps.length) {
        useCases.push({
          title: ucTitle,
          targetAudience: audience,
          stepByStep: steps,
          promptTemplate: asString(item?.promptTemplate) || undefined,
        });
      }
    });
  }

  // News pieces are prose-led: the body IS the article.
  const bodyText = content.trim();
  if (bodyText.length < 200) {
    errors.push(
      `Body prose is required and must be at least 200 characters of reported news. Got ${bodyText.length}.`
    );
  }

  // Hero image: must exist on disk if it points into /public, and must have alt text.
  const heroImage = asString(data.heroImage);
  const heroImageAlt = asString(data.heroImageAlt);
  if (heroImage) {
    if (!heroImageAlt) {
      errors.push("`heroImageAlt` is required whenever `heroImage` is set.");
    }
    // Images must be self-hosted: next.config.mjs allows no remote patterns, so
    // an external URL would pass validation and then fail to render in production.
    if (heroImage.startsWith("/")) {
      const onDisk = path.join(process.cwd(), "public", heroImage.replace(/^\//, ""));
      if (!fs.existsSync(onDisk)) {
        errors.push(`\`heroImage\` points at "${heroImage}" but no such file is committed.`);
      }
    } else {
      errors.push(
        "`heroImage` must be a path under /public (e.g. /images/articles/name.png). " +
          "Commit the image to the repo rather than linking to an external URL."
      );
    }
  }

  // Timestamps. `publishedDate` is when the SOURCE published; `retrievedAt` is
  // when the agent fetched it. Both must be real — a fabricated date on a news
  // article is a factual error, so an unparseable value is rejected rather than
  // quietly defaulted to now.
  let sourcePublishedAt: Date | undefined;
  let retrievedAt: Date | undefined;

  const rawPublished = data.publishedDate;
  if (rawPublished !== undefined && rawPublished !== null && rawPublished !== "") {
    const d = rawPublished instanceof Date ? rawPublished : new Date(String(rawPublished));
    if (Number.isNaN(d.getTime())) {
      errors.push(`\`publishedDate\` is not a valid date: "${String(rawPublished)}"`);
    } else if (d.getTime() > Date.now() + 864e5) {
      errors.push("`publishedDate` is in the future. Use the date shown on the source.");
    } else {
      sourcePublishedAt = d;
    }
  } else {
    errors.push("`publishedDate` is required — the date the original source published.");
  }

  const rawRetrieved = data.retrievedAt;
  if (rawRetrieved !== undefined && rawRetrieved !== null && rawRetrieved !== "") {
    const d = rawRetrieved instanceof Date ? rawRetrieved : new Date(String(rawRetrieved));
    if (Number.isNaN(d.getTime())) {
      errors.push(`\`retrievedAt\` is not a valid timestamp: "${String(rawRetrieved)}"`);
    } else {
      retrievedAt = d;
    }
  } else {
    errors.push("`retrievedAt` is required — when the source page was fetched.");
  }

  // --- SEO ---------------------------------------------------------------
  // Derived when not given, so no article ships without a title tag, a
  // description and a clean slug. Search is the only traffic source that
  // compounds, so these are not optional extras.
  const slug = asString(data.slug)
    ? normaliseSlug(asString(data.slug))
    : optimiseSlug(title);
  const seoTitle = deriveSeoTitle(asString(data.seoTitle) || undefined, title);
  const metaDescription = deriveMetaDescription(
    asString(data.metaDescription) || undefined,
    summary
  );
  const keywords = normaliseKeywords(data.keywords);

  const seoIssues = auditSeo({ slug, seoTitle, metaDescription, keywords, title });
  const seoErrors = seoIssues.filter((i) => i.severity === "error");
  const seoWarnings = seoIssues.filter((i) => i.severity === "warning");
  seoErrors.forEach((i) => errors.push(`SEO ${i.field}: ${i.message}`));

  if (errors.length > 0) {
    return { ok: false, failure: { file: fileName, errors } };
  }

  const externalId = fileName.replace(/\.mdx?$/i, "");

  return {
    ok: true,
    article: {
      externalId,
      slug,
      type: type as ArticleType,
      keyPoints,
      title,
      summary,
      category: matchedCategory!,
      verdict,
      jargonBuster,
      useCases,
      sourceName,
      sourceUrl,
      toolName: asString(data.toolName) || undefined,
      heroImage: heroImage || undefined,
      heroImageAlt: heroImageAlt || undefined,
      heroImageCredit: asString(data.heroImageCredit) || undefined,
      sourcePublishedAt,
      retrievedAt,
      body: bodyText,
      seoTitle,
      metaDescription,
      keywords,
      seoWarnings,
      sourceHash: crypto.createHash("sha256").update(raw).digest("hex").slice(0, 16),
    },
  };
}

export function listArticleFiles(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => /\.mdx?$/i.test(f))
    .map((f) => path.join(CONTENT_DIR, f))
    .sort();
}

/** Rough read time from everything that will be rendered. */
export function estimateReadingMinutes(a: ParsedArticle): number {
  const text = [
    a.summary,
    a.verdict,
    a.body,
    ...a.jargonBuster.map((j) => j.plainEnglish),
    ...a.useCases.flatMap((u) => [...u.stepByStep, u.promptTemplate || ""]),
  ].join(" ");
  return Math.max(2, Math.round(text.split(/\s+/).filter(Boolean).length / 200));
}

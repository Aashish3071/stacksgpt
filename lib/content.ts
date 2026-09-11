import fs from "fs";
import path from "path";
import crypto from "crypto";
import yaml from "yaml";
import {
  ARTICLE_TYPE_KEYS,
  ArticleType,
  CATEGORIES,
  PRACTICAL_TYPES,
  REPORTING_TYPES,
} from "./site";
import { editorialErrors } from "./editorial-rules";
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
export const IMAGE_DIR = path.join(
  process.cwd(),
  "public",
  "images",
  "articles",
);

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
  tags: string[];
  audiences: string[];
  heroImageOrigin: string;
  structuredVerdict?: Record<string, string>;
  additionalSources?: any[];
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
  { ok: true; article: ParsedArticle } | { ok: false; failure: ParseFailure };

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Validates one MDX file. Returns every problem at once, not just the first. */
export function parseArticleFile(filePath: string): ParseResult {
  const fileName = path.basename(filePath);
  const raw = fs.readFileSync(filePath, "utf8");
  return parseArticleText(raw, fileName);
}

export function parseArticleText(
  raw: string,
  fileName: string,
  options = { checkLocalFiles: true },
): ParseResult {
  let data: Record<string, unknown>;
  let content: string;
  try {
    const match = raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
    if (!match) throw new Error("Missing frontmatter");
    data = (yaml.parse(match[1]) ?? {}) as Record<string, unknown>;
    content = raw.slice(match[0].length);
  } catch {
    return {
      ok: false,
      failure: { file: fileName, errors: ["Invalid YAML frontmatter."] },
    };
  }
  const errors: string[] = [];

  const title = asString(data.title);
  const summary = asString(data.summary);
  const verdict = asString(data.verdict);
  const sourceUrl = asString(data.sourceUrl);
  const sourceName = asString(data.sourceName);
  const category = asString(data.category);

  const matchedCategory = CATEGORIES.find(
    (c) => c.toLowerCase() === category.toLowerCase(),
  );
  // Story type decides which sections are required below.
  const rawType = asString(data.type)
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  const type = ARTICLE_TYPE_KEYS.find((t) => t === rawType);
  // Key points: the scannable bullet pointers (What's new / key facts).
  const keyPoints: string[] = Array.isArray(data.keyPoints)
    ? data.keyPoints.map(asString).filter(Boolean)
    : [];

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
  if (/^\s*(import|export)\s|<\/?[a-zA-Z]|\{[^}]*\}/m.test(bodyText))
    errors.push(
      "Use plain Markdown, without HTML, JSX, imports, or executable expressions.",
    );
  // Hero image. Presence, alt text and credit are checked by the shared rules;
  // what is MDX-specific is that the file must actually exist in the repo.
  const heroImage = asString(data.heroImage);
  const heroImageAlt = asString(data.heroImageAlt);
  if (heroImage) {
    // Images must be self-hosted: next.config.mjs allows no remote patterns, so
    // an external URL would pass validation and then fail to render in production.
    if (
      /^\/images\/articles\/[a-zA-Z0-9_-]+\.(png|jpe?g|webp|avif)$/.test(
        heroImage,
      )
    ) {
      const onDisk = path.join(
        process.cwd(),
        "public",
        heroImage.replace(/^\//, ""),
      );
      if (options.checkLocalFiles && !fs.existsSync(onDisk)) {
        errors.push(
          `\`heroImage\` points at "${heroImage}" but no such file is committed.`,
        );
      }
    } else if (
      !process.env.SUPABASE_URL ||
      !heroImage.startsWith(
        `${process.env.SUPABASE_URL}/storage/v1/object/public/article-media/`,
      ) ||
      /[?#]/.test(heroImage)
    ) {
      errors.push(
        "`heroImage` must be a path under /public (e.g. /images/articles/name.png). " +
          "Commit the image to the repo rather than linking to an external URL.",
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
  if (
    typeof rawPublished === "string" &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(rawPublished) ||
      !Number.isFinite(new Date(rawPublished).getTime()) ||
      new Date(rawPublished).toISOString().slice(0, 10) !== rawPublished)
  )
    errors.push(
      "publishedDate must be an actual calendar date in YYYY-MM-DD format.",
    );
  if (
    rawPublished !== undefined &&
    rawPublished !== null &&
    rawPublished !== ""
  ) {
    const d =
      rawPublished instanceof Date
        ? rawPublished
        : new Date(String(rawPublished));
    if (Number.isNaN(d.getTime())) {
      errors.push(
        `\`publishedDate\` is not a valid date: "${String(rawPublished)}"`,
      );
    } else if (d.getTime() > Date.now()) {
      errors.push(
        "`publishedDate` is in the future. Use the date shown on the source.",
      );
    } else {
      sourcePublishedAt = d;
    }
  } else {
    errors.push(
      "`publishedDate` is required: the date the original source published.",
    );
  }

  const rawRetrieved = data.retrievedAt;
  if (
    typeof rawRetrieved === "string" &&
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/.test(rawRetrieved)
  )
    errors.push("retrievedAt must include its UTC time, ending in Z.");
  if (
    rawRetrieved !== undefined &&
    rawRetrieved !== null &&
    rawRetrieved !== ""
  ) {
    const d =
      rawRetrieved instanceof Date
        ? rawRetrieved
        : new Date(String(rawRetrieved));
    if (Number.isNaN(d.getTime())) {
      errors.push(
        `\`retrievedAt\` is not a valid timestamp: "${String(rawRetrieved)}"`,
      );
    } else if (d.getTime() > Date.now()) {
      errors.push("retrievedAt cannot be in the future.");
    } else {
      retrievedAt = d;
    }
  } else {
    errors.push("`retrievedAt` is required: when the source page was fetched.");
  }

  if (sourcePublishedAt && retrievedAt && sourcePublishedAt > retrievedAt)
    errors.push("Source publication cannot follow retrieval.");
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
    summary,
  );
  const keywords = normaliseKeywords(data.keywords);

  const seoIssues = auditSeo({
    slug,
    seoTitle,
    metaDescription,
    keywords,
    title,
  });
  const seoErrors = seoIssues.filter((i) => i.severity === "error");
  const seoWarnings = seoIssues.filter((i) => i.severity === "warning");
  seoErrors.forEach((i) => errors.push(`SEO ${i.field}: ${i.message}`));

  // The shared editorial rules. Everything above this point is MDX-specific
  // parsing (frontmatter shape, image present on disk, SEO derivation); the
  // rules that decide whether an article is publishable live in one module so
  // the newsroom and this importer cannot drift apart.
  errors.push(
    ...editorialErrors({
      title,
      summary,
      verdict,
      body: bodyText,
      keyPoints,
      slug,
      type: type ?? asString(data.type),
      category: matchedCategory ?? category,
      seoTitle,
      metaDescription,
      sourceAuthor: sourceName,
      sourceUrl,
      sourcePublishedAt,
      retrievedAt,
      heroImage,
      heroImageAlt,
      heroImageCredit: asString(data.heroImageCredit),
    }),
  );

  if (errors.length > 0) {
    return { ok: false, failure: { file: fileName, errors } };
  }

  const externalId = fileName.replace(/\.mdx?$/i, "");

  return {
    ok: true,
    article: {
      tags: Array.isArray(data.tags) ? data.tags.map(asString) : [],
      audiences: Array.isArray(data.audiences)
        ? data.audiences.map(asString)
        : [],
      heroImageOrigin: asString(data.heroImageOrigin) || "generated",
      structuredVerdict:
        data.structuredVerdict && typeof data.structuredVerdict === "object"
          ? (data.structuredVerdict as Record<string, string>)
          : undefined,
      additionalSources: Array.isArray(data.additionalSources)
        ? data.additionalSources
        : undefined,
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
      sourceHash: crypto
        .createHash("sha256")
        .update(raw)
        .digest("hex")
        .slice(0, 16),
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
  return Math.max(
    2,
    Math.round(text.split(/\s+/).filter(Boolean).length / 200),
  );
}

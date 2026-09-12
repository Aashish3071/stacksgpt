"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import ArticleCard, { ArticleCardData } from "@/components/ArticleCard";
import AdBanner from "@/components/AdBanner";
import AdSlot from "@/components/AdSlot";
import { ARTICLE_TYPES, categoryHref, formatDate, isoDate } from "@/lib/site";

export interface ReaderArticle {
  updatedAt?: Date | string | null;
  authorName?: string;
  correctionNote?: string | null;
  heroImageOrigin?: string;
  tags?: string[];
  audiences?: string[];
  structuredVerdict?: {
    whoShouldUse?: string;
    limitations?: string;
    pricing?: string;
    recommendation?: string;
  } | null;
  additionalSources?: { name: string; url: string }[] | null;
  jargonBuster?: string;
  useCases?: string;
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  readingMinutes: number;
  publishedAt: Date | string | null;
  sourceAuthor?: string | null;
  sourceUrl?: string | null;
  type?: string;
  keyPoints?: string | null;
  verdict: string;
  body?: string | null;
  bodyHtml?: string | null;
  heroImage?: string | null;
  heroImageAlt?: string | null;
  heroImageCredit?: string | null;
  sourcePublishedAt?: Date | string | null;
  primaryTool?: {
    name: string;
    slug: string;
    tagline: string;
    pricingModel: string;
    websiteUrl: string;
    affiliateUrl?: string | null;
    status?: string | null;
  } | null;
}

function safeParse<T>(raw: string): T[] {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export default function ArticleReader({
  article,
  related = [],
}: {
  article: ReaderArticle;
  related?: ArticleCardData[];
}) {
  const keyPoints = safeParse<string>(article.keyPoints || "[]");
  const tool = article.primaryTool;
  const typeKey = (article.type || "NEWS") as keyof typeof ARTICLE_TYPES;
  const typeLabel = ARTICLE_TYPES[typeKey] || "News";

  // A partner link renders only when a real, approved URL has been entered by hand.
  const isPartnerLink = Boolean(
    tool?.affiliateUrl && tool?.status === "ACTIVE",
  );

  return (
    <>
      <article className="mx-auto max-w-measure px-4 py-10 sm:px-6">
        {/* Header */}
        <header>
          <div className="flex items-baseline gap-2">
            <Link
              href={categoryHref(article.category)}
              className="kicker hover:underline"
            >
              {article.category}
            </Link>
            <span className="kicker-muted">{typeLabel}</span>
          </div>

          <h1 className="mt-3 font-serif text-head-lg font-semibold text-ink sm:text-head-xl">
            {article.title}
          </h1>

          <p className="mt-4 font-serif text-dek text-muted">
            {article.summary}
          </p>

          <p className="meta mt-5 border-t border-rule pt-3">
            {article.publishedAt && (
              <>
                <time
                  dateTime={isoDate(article.publishedAt)}
                  suppressHydrationWarning
                >
                  {formatDate(article.publishedAt)}
                </time>
                <span aria-hidden> · </span>
              </>
            )}
            <span>{article.readingMinutes} min read</span>
            {article.authorName && <span> · By {article.authorName}</span>}
            {article.updatedAt &&
              article.publishedAt &&
              isoDate(article.updatedAt) !== isoDate(article.publishedAt) && (
                <span>
                  {" "}
                  · Updated{" "}
                  <time dateTime={isoDate(article.updatedAt)}>
                    {formatDate(article.updatedAt)}
                  </time>
                </span>
              )}
          </p>
        </header>

        {/* Hero image */}
        {article.heroImage && (
          <figure className="mt-8">
            <Image
              src={article.heroImage}
              alt={article.heroImageAlt || ""}
              width={1200}
              height={630}
              priority
              sizes="(max-width: 768px) 100vw, 680px"
              className="h-auto w-full border border-rule"
            />
            {article.heroImageCredit &&
              !article.heroImageCredit.toLowerCase().includes("stacksgpt") &&
              !article.heroImageCredit.toLowerCase().includes("illustration generated") &&
              !article.heroImageCredit.toLowerCase().includes("ai-generated") && (
              <figcaption className="meta mt-2">
                {article.heroImageCredit}
              </figcaption>
            )}
          </figure>
        )}

        {/* Small Summary in Pointers: WHAT'S NEW & WHY IT MATTERS */}
        {(keyPoints.length > 0 || article.verdict) && (
          <section className="mt-8 border-y border-rule bg-surface/50 p-6 sm:p-7 space-y-6">
            {keyPoints.length > 0 && (
              <div>
                <h2 className="kicker text-ink font-semibold tracking-wide flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-accent" />
                  What&rsquo;s New
                </h2>
                <ul className="mt-3 space-y-2.5">
                  {keyPoints.map((point, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 font-serif text-body text-ink"
                    >
                      <span
                        aria-hidden
                        className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                      />
                      <span className="leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {article.verdict && (
              <div
                className={
                  keyPoints.length > 0 ? "border-t border-rule pt-5" : ""
                }
              >
                <h2 className="kicker text-ink font-semibold tracking-wide flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-ink" />
                  Why It Matters
                </h2>
                <p className="mt-2.5 font-serif text-body text-ink leading-relaxed">
                  {article.verdict}
                </p>
              </div>
            )}
          </section>
        )}

        <AdBanner bannerId="2028053" />

        {/* The Reported News Article Body */}
        {article.bodyHtml && (
          <div
            className="article-prose mt-8"
            dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
          />
        )}

        {/* In-article unit, after the body rather than inside it: it sits at a
            natural break between the reporting and the assessment, so it never
            interrupts a sentence or pushes the article's own content down. */}
        <AdSlot placement="article-mid-body" />

        {article.structuredVerdict && (
          <section className="mt-8 border-t pt-5 space-y-3">
            <h2 className="font-serif text-2xl">Our assessment</h2>
            {Object.entries(article.structuredVerdict)
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <p key={k}>
                  <strong>
                    {(
                      {
                        whoShouldUse: "Who it suits",
                        limitations: "Limitations",
                        pricing: "Pricing",
                        recommendation: "Recommendation",
                      } as any
                    )[k] || k}
                    :
                  </strong>{" "}
                  {v}
                </p>
              ))}
          </section>
        )}
        {article.correctionNote && (
          <aside className="mt-8 border-l-2 border-accent p-4 bg-surface">
            <strong>Correction:</strong> {article.correctionNote}
          </aside>
        )}
        <nav aria-label="Related topics" className="flex flex-wrap items-center gap-2 mt-6">
          {article.tags && article.tags.length > 0 && (
            <span className="text-xs font-semibold text-muted uppercase tracking-wider mr-1">
              Tags:
            </span>
          )}
          {article.tags?.map((t) => (
            <Link
              key={t}
              className="inline-flex items-center rounded border border-rule bg-surface px-2.5 py-1 font-sans text-xs font-medium text-ink hover:border-ink hover:bg-paper transition-colors"
              href={`/tag/${t}`}
            >
              #{t.replaceAll("-", " ")}
            </Link>
          ))}
          {article.audiences?.map((t) => (
            <Link
              key={t}
              className="inline-flex items-center rounded border border-rule bg-surface px-2.5 py-1 font-sans text-xs font-medium text-muted hover:text-ink hover:border-ink hover:bg-paper transition-colors"
              href={`/audience/${t}`}
            >
              For {t.replaceAll("-", " ")}
            </Link>
          ))}
          {article.sourceAuthor && (
            <Link
              className="inline-flex items-center rounded border border-rule bg-surface px-2.5 py-1 font-sans text-xs font-medium text-muted hover:text-ink hover:border-ink hover:bg-paper transition-colors"
              href={`/source/${article.sourceAuthor
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "")}`}
            >
              More from {article.sourceAuthor}
            </Link>
          )}
        </nav>

        {/* Tool reference */}
        {tool && (
          <section className="mt-12 border-t border-rule pt-6">
            <h2 className="kicker-muted">The Tool Profile</h2>
            <p className="mt-2 font-serif text-head-sm font-semibold text-ink">
              {tool.name}
            </p>
            <p className="mt-1 font-sans text-meta leading-relaxed text-muted">
              {tool.tagline}
            </p>
            <p className="meta mt-2">Pricing: {tool.pricingModel}</p>

            <p className="mt-3">
              {isPartnerLink ? (
                <>
                  <Link
                    href={`/api/affiliate/${tool.slug}`}
                    target="_blank"
                    rel="sponsored nofollow noopener"
                    className="font-sans text-meta font-medium text-accent underline decoration-rule-strong hover:decoration-accent"
                  >
                    Visit {tool.name}
                  </Link>
                  <span className="meta">
                    {" "}
                    (partner link, we may earn a commission)
                  </span>
                </>
              ) : (
                <a
                  href={tool.websiteUrl}
                  target="_blank"
                  rel="nofollow noreferrer"
                  className="font-sans text-meta font-medium text-accent underline decoration-rule-strong hover:decoration-accent"
                >
                  Visit {tool.name}
                </a>
              )}
            </p>
          </section>
        )}

        <AdBanner bannerId="2028054" />

        {/* Source attribution */}
        <footer className="mt-12 border-t border-rule pt-5">
          {article.additionalSources?.length ? (
            <>
              <h2 className="font-serif text-xl">Additional sources</h2>
              <ul className="my-4">
                {article.additionalSources.map((s) => (
                  <li key={s.url}>
                    <a
                      className="underline"
                      href={s.url}
                      rel="noopener noreferrer"
                    >
                      {s.name}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          <p className="meta leading-relaxed">
            <strong className="font-semibold text-muted">Source:</strong>{" "}
            Reported from{" "}
            {article.sourceUrl ? (
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noreferrer nofollow"
                className="underline decoration-rule-strong hover:text-ink font-medium"
              >
                {article.sourceAuthor ? `${article.sourceAuthor}'s original announcement` : "the original announcement"}
              </a>
            ) : (
              article.sourceAuthor || "the original announcement"
            )}{" "}
            with editorial review by StacksGPT. See our{" "}
            <Link
              href="/editorial-standards"
              className="underline decoration-rule-strong hover:text-ink"
            >
              editorial standards
            </Link>
            .
          </p>
        </footer>
      </article>

      {/* Related stories in this category */}
      {related.length > 0 && (
        <section className="mx-auto max-w-shell border-t border-rule px-4 py-10 sm:px-6">
          <h2 className="kicker-muted border-b border-rule pb-2">
            More in {article.category}
          </h2>
          <div className="grid gap-x-8 gap-y-8 pt-7 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ArticleCard key={item.id} article={item} variant="square" />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

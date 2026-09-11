import Link from "next/link";
import Image from "next/image";
import { ARTICLE_TYPES, categoryHref, formatDate, isoDate } from "@/lib/site";

export interface ArticleCardData {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  readingMinutes: number;
  publishedAt: Date | string | null;
  sourceAuthor?: string | null;
  heroImage?: string | null;
  heroImageAlt?: string | null;
  type?: string | null;
}

interface Props {
  article: ArticleCardData;
  /**
   * lead: the one story the page opens with
   * standard: grid item in the river
   * compact: scannable list item, headline and read time only
   */
  variant?: "lead" | "standard" | "compact" | "square";
}

/**
 * Read time is shown everywhere on purpose: "do I have three minutes?" is the
 * actual decision a reader makes, and answering it up front is what turns a
 * scan into a click.
 */
function Meta({ article, showDate = true }: { article: ArticleCardData; showDate?: boolean }) {
  const date = formatDate(article.publishedAt);
  return (
    <p className="meta mt-2">
      {showDate && date && (
        <>
          <time dateTime={isoDate(article.publishedAt)} suppressHydrationWarning>
            {date}
          </time>
          <span aria-hidden> · </span>
        </>
      )}
      <span>{article.readingMinutes} min</span>
    </p>
  );
}

/** The story-type label, e.g. "Announcement". Tells a reader what kind of piece this is. */
function TypeLabel({ type }: { type?: string | null }) {
  const label = type ? ARTICLE_TYPES[type as keyof typeof ARTICLE_TYPES] : null;
  if (!label) return null;
  return <span className="kicker-muted">{label}</span>;
}

export default function ArticleCard({ article, variant = "standard" }: Props) {
  const href = `/article/${article.slug}`;

  // Square card: a uniform grid tile. Every image occupies the same box whether
  // or not the article has one, so rows stay aligned and the grid reads as a grid.
  if (variant === "square") {
    return (
      <article className="group flex flex-col">
        <Link href={href} className="block">
          <div className="relative aspect-[4/3] w-full overflow-hidden border border-rule bg-paper">
            {article.heroImage ? (
              <Image
                src={article.heroImage}
                alt={article.heroImageAlt || ""}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
            ) : (
              <span className="flex h-full items-center justify-center px-4 text-center font-serif text-head-sm text-rule-strong">
                {article.category}
              </span>
            )}
          </div>
        </Link>

        <div className="mt-3 flex flex-1 flex-col">
          <TypeLabel type={article.type} />
          <h3 className="mt-1 font-serif text-head-sm font-semibold leading-snug">
            <Link href={href} className="text-ink hover:text-accent">
              {article.title}
            </Link>
          </h3>
          <Meta article={article} />
        </div>
      </article>
    );
  }

  // Compact: nothing but the headline and how long it takes. No category label,
  // no standfirst: a scannable column, not ten miniature articles.
  if (variant === "compact") {
    return (
      <article className="py-3">
        <h3 className="font-serif text-head-sm font-semibold leading-snug">
          <Link href={href} className="text-ink hover:text-accent block py-1">
            {article.title}
          </Link>
        </h3>
        <Meta article={article} showDate={false} />
      </article>
    );
  }

  if (variant === "lead") {
    return (
      <article>
        <div className="flex items-baseline gap-2">
          <Link
            href={categoryHref(article.category)}
            className="kicker hover:underline inline-block py-1"
          >
            {article.category}
          </Link>
          <TypeLabel type={article.type} />
        </div>

        <h2 className="mt-2 font-serif text-head-xl font-semibold leading-[1.08] text-ink sm:text-head-2xl">
          <Link href={href} className="hover:text-accent">
            {article.title}
          </Link>
        </h2>

        <p className="mt-4 max-w-measure-wide font-serif text-dek text-muted">
          {article.summary}
        </p>

        <Meta article={article} />

        {article.heroImage && (
          <Link href={href} className="mt-5 block">
            <Image
              src={article.heroImage}
              alt={article.heroImageAlt || ""}
              width={1200}
              height={630}
              priority
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1152px"
              className="h-auto w-full border border-rule"
            />
          </Link>
        )}
      </article>
    );
  }

  // Standard: category label is muted rather than accent, so ten of them in a
  // grid read as quiet metadata instead of ten competing red flags.
  return (
    <article className="flex flex-col">
      {article.heroImage && (
        <Link href={href} className="mb-3 block">
          <Image
            src={article.heroImage}
            alt={article.heroImageAlt || ""}
            width={600}
            height={315}
            sizes="(max-width: 640px) 100vw, 360px"
            className="h-auto w-full border border-rule"
          />
        </Link>
      )}

      <Link
        href={categoryHref(article.category)}
        className="kicker-muted hover:text-accent inline-block py-1"
      >
        {article.category}
      </Link>

      <h3 className="mt-1 font-serif text-head-md font-semibold leading-tight">
        <Link href={href} className="text-ink hover:text-accent">
          {article.title}
        </Link>
      </h3>

      <p className="mt-2 font-sans text-meta leading-relaxed text-muted line-clamp-2">
        {article.summary}
      </p>

      <Meta article={article} />
    </article>
  );
}

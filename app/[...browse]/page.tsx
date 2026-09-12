import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { discover } from "@/lib/discovery";
import ArticleCard from "@/components/ArticleCard";
import CollectionSchema from "@/components/CollectionSchema";
import { siteUrl, SITE_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ browse: string[] }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}

function formatTitle(kind: string, slug?: string): { title: string; description: string } {
  if (kind === "search") {
    return {
      title: "Search AI Articles & Guides",
      description: "Search reporting, model releases, and technical AI analysis on StacksGPT.",
    };
  }
  if (kind === "latest") {
    return {
      title: "Latest AI News, Model Releases & Analysis",
      description: "Real-time, high-signal reporting on frontier AI models, developer APIs, and engineering breakthroughs.",
    };
  }
  if (kind === "archive") {
    return {
      title: "The AI Archive: Models, Releases & History",
      description: "Explore the comprehensive chronological archive of artificial intelligence reporting and releases on StacksGPT.",
    };
  }
  if (kind === "tag" && slug) {
    const formatted = slug
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");
    return {
      title: `${formatted} News, Workflows & AI Analysis`,
      description: `Explore the latest AI models, technical breakthroughs, benchmarks, and developer workflows tagged #${slug} on StacksGPT.`,
    };
  }
  if (kind === "source" && slug) {
    const formatted = slug
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");
    return {
      title: `${formatted} AI News & Model Releases`,
      description: `Independent reporting, benchmark analysis, and developer updates covering models and tools released by ${formatted}.`,
    };
  }
  if (kind === "audience" && slug) {
    const formatted = slug
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");
    return {
      title: `AI Workflows & Guides for ${formatted}`,
      description: `Curated AI guides, tools, and news tailored specifically for ${formatted}.`,
    };
  }
  return {
    title: "Browse Articles",
    description: "Browse AI updates and technical analysis on StacksGPT.",
  };
}

export async function generateMetadata({ params, searchParams }: Props) {
  const p = (await params).browse;
  const [kind, slug] = p;
  const page = Math.max(1, parseInt((await searchParams).page || "1") || 1);
  const { title: rawTitle, description } = formatTitle(kind, slug);
  const title = `${rawTitle}${page > 1 ? ` · Page ${page}` : ""}`;
  const canonicalUrl = siteUrl("/" + p.join("/") + (page > 1 ? `?page=${page}` : ""));

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: kind === "search" ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title: `${title} · ${SITE_NAME}`,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      type: "website",
      images: [
        {
          url: siteUrl("/images/logos/logo.jpg"),
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${SITE_NAME}`,
      description,
      images: [siteUrl("/images/logos/logo.jpg")],
    },
  };
}

export default async function Browse({ params, searchParams }: Props) {
  const [kind, slug, ...rest] = (await params).browse;
  const search = await searchParams;
  if (
    rest.length ||
    !["latest", "archive", "search", "tag", "source", "audience"].includes(
      kind,
    ) ||
    (["tag", "source", "audience"].includes(kind) && !slug) ||
    (["latest", "archive", "search"].includes(kind) && slug)
  )
    notFound();

  try {
    if (
      ["tag", "audience"].includes(kind) &&
      !(await prisma.taxonomy.findUnique({
        where: {
          kind_slug: { kind: kind === "tag" ? "TAG" : "AUDIENCE", slug: slug! },
        },
      }))
    )
      notFound();
    if (kind === "source") {
      const source = await prisma.taxonomy.findUnique({
        where: { kind_slug: { kind: "SOURCE", slug } },
      });
      if (
        !source?.active ||
        !(await prisma.article.count({
          where: { isPublished: true, sourceAuthor: source.name },
        }))
      )
        notFound();
    }
  } catch (err) {
    console.warn("Could not check taxonomy in browse:", err);
  }

  const q = kind === "search" ? (search.q || "").slice(0, 200) : "";
  const page = Math.max(1, Math.min(100000, parseInt(search.page || "1") || 1));
  let items: any[] = [];
  let total = 0;
  try {
    const res = await discover({ q, page, kind, slug });
    items = res.items;
    total = res.total;
  } catch (err) {
    console.warn("Could not discover browse articles:", err);
  }

  const { title: headingTitle, description: pageDescription } = formatTitle(kind, slug);
  const href = (p: number) => `?${new URLSearchParams({ q, page: String(p) })}`;
  const currentUrl = siteUrl("/" + [kind, slug].filter(Boolean).join("/") + (page > 1 ? `?page=${page}` : ""));

  const breadcrumbs = [
    { name: "Home", url: siteUrl() },
    {
      name: kind === "tag" ? `#${slug}` : headingTitle,
      url: siteUrl("/" + [kind, slug].filter(Boolean).join("/")),
    },
  ];
  if (page > 1) {
    breadcrumbs.push({ name: `Page ${page}`, url: currentUrl });
  }

  return (
    <>
      {kind !== "search" && (
        <CollectionSchema
          name={headingTitle}
          description={pageDescription}
          url={currentUrl}
          breadcrumbs={breadcrumbs}
          items={items.map((a) => ({
            title: a.title,
            slug: a.slug,
            publishedAt: a.publishedAt,
            summary: a.summary,
          }))}
        />
      )}
      <div className="max-w-shell mx-auto px-4 py-10 sm:px-6">
        <div className="border-b border-rule pb-6">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-widest text-accent font-semibold">
              {kind === "tag" ? "Topic Cluster" : kind === "source" ? "Source Feed" : "Intelligence Dispatch"}
            </span>
          </div>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-ink sm:text-4xl capitalize">
            {kind === "tag" ? `#${slug?.replaceAll("-", " ")}` : headingTitle}
          </h1>
          <p className="meta mt-2 text-muted">
            {pageDescription} {total > 0 ? `(${total} ${total === 1 ? "story" : "stories"})` : ""}
          </p>
        </div>

        {kind === "search" && (
          <form className="my-8 flex gap-3 max-w-xl">
            <label className="sr-only" htmlFor="search">
              Search articles
            </label>
            <input
              id="search"
              name="q"
              type="search"
              defaultValue={q}
              maxLength={200}
              placeholder="Search topics, models, sources, or a keyword…"
              className="border border-rule rounded p-3 flex-1 bg-surface font-sans text-sm focus:outline-none focus:border-ink"
            />
            <button className="bg-ink text-paper px-6 py-3 rounded font-sans text-sm font-medium hover:bg-muted transition-colors">
              Search
            </button>
          </form>
        )}

        <p className="my-6 font-sans text-xs uppercase tracking-wider text-muted font-medium">
          {total} {total === 1 ? "story" : "stories"}
          {q ? ` matching “${q}”` : ""}
        </p>

        {items.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="font-serif text-lg text-ink">
              No published stories found here yet.
            </p>
            <p className="meta mt-2 text-muted">
              {q ? "Try searching for a different keyword or topic." : "Check back soon for fresh reporting in this topic."}
            </p>
          </div>
        )}

        {total > 12 && (
          <nav
            className="flex justify-between items-center border-t border-rule mt-10 pt-5 font-sans text-sm"
            aria-label="Pagination"
          >
            {page > 1 ? (
              <Link href={href(page - 1)} prefetch={true} className="meta hover:text-ink font-medium">
                ← Previous
              </Link>
            ) : (
              <span />
            )}
            <span className="meta">Page {page}</span>
            {page * 12 < total ? (
              <Link href={href(page + 1)} prefetch={true} className="meta hover:text-ink font-medium">
                Next →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </div>
    </>
  );
}

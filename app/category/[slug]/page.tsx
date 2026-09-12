import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/db";
import { discover } from "@/lib/discovery";
import ArticleCard from "@/components/ArticleCard";
import CollectionSchema from "@/components/CollectionSchema";
import { CATEGORIES, siteUrl, SITE_NAME } from "@/lib/site";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export const revalidate = 60;

export async function generateStaticParams() {
  return CATEGORIES.map((c) => ({
    slug: c.toLowerCase(),
  }));
}

export async function generateMetadata({ params, searchParams }: Props) {
  try {
    const { slug } = await params;
    const page = Math.max(1, parseInt((await searchParams).page || "1") || 1);
    const matchedBuiltin = (CATEGORIES as readonly string[]).find(
      (c) =>
        c.toLowerCase() === slug.toLowerCase() ||
        c.toLowerCase() === slug.replaceAll("-", " ").toLowerCase(),
    );
    const readable = matchedBuiltin || slug.replaceAll("-", " ");
    const formatted = readable.charAt(0).toUpperCase() + readable.slice(1);
    const title = `${formatted} AI News, Tools & Analysis${page > 1 ? ` · Page ${page}` : ""}`;
    const description = `Explore breaking ${formatted.toLowerCase()} AI announcements, practical engineering workflows, benchmarks, and deep-dive technical reporting on StacksGPT.`;
    const canonicalUrl = siteUrl(`/category/${slug}${page > 1 ? `?page=${page}` : ""}`);

    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
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
            alt: `${formatted} AI News & Analysis`,
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
  } catch {
    return { title: "Category news" };
  }
}

export default async function Page({ params, searchParams }: Props) {
  const { slug } = await params;

  const matchedBuiltin = (CATEGORIES as readonly string[]).find(
    (c) =>
      c.toLowerCase() === slug.toLowerCase() ||
      c.toLowerCase() === slug.replaceAll("-", " ").toLowerCase(),
  );

  let category: { name: string; slug: string; description?: string } | null =
    null;

  if (matchedBuiltin) {
    category = {
      name: matchedBuiltin,
      slug: matchedBuiltin.toLowerCase(),
      description: `Reporting, benchmarks, and technical analysis on ${matchedBuiltin.toLowerCase()} in AI and software engineering.`,
    };
  } else {
    try {
      category = await prisma.taxonomy.findFirst({
        where: {
          kind: "CATEGORY",
          OR: [
            { slug },
            { name: { equals: slug.replaceAll("-", " "), mode: "insensitive" } },
          ],
        },
      });
    } catch (err) {
      console.warn("Could not query taxonomy category:", err);
    }
  }

  if (!category) {
    notFound();
  }

  const categoryName = category.name;
  const categorySlug = category.slug || slug;
  const page = Math.max(
    1,
    Math.min(100000, parseInt((await searchParams).page || "1") || 1),
  );

  let items: any[] = [];
  let total = 0;
  try {
    const res = await discover({
      page,
      kind: "category",
      slug: categorySlug,
    });
    items = res.items;
    total = res.total;
  } catch (err) {
    console.warn("Could not discover category articles:", err);
  }

  const currentUrl = siteUrl(`/category/${categorySlug}${page > 1 ? `?page=${page}` : ""}`);
  const breadcrumbs = [
    { name: "Home", url: siteUrl() },
    { name: categoryName, url: siteUrl(`/category/${categorySlug}`) },
  ];
  if (page > 1) {
    breadcrumbs.push({ name: `Page ${page}`, url: currentUrl });
  }

  return (
    <>
      <CollectionSchema
        name={`${categoryName} AI News & Analysis`}
        description={category.description || `Latest reporting and updates in ${categoryName.toLowerCase()}.`}
        url={currentUrl}
        breadcrumbs={breadcrumbs}
        items={items.map((a) => ({
          title: a.title,
          slug: a.slug,
          publishedAt: a.publishedAt,
          summary: a.summary,
        }))}
      />
      <div className="mx-auto max-w-shell px-4 py-10 sm:px-6">
        <div className="border-b border-rule pb-6">
          <h1 className="font-serif text-3xl font-semibold text-ink sm:text-4xl">
            {categoryName}
          </h1>
          <p className="meta mt-2 text-muted">
            {category.description ||
              (total > 0
                ? `${total} published ${total === 1 ? "story" : "stories"}`
                : `Latest reporting and updates in ${categoryName.toLowerCase()}.`)}
          </p>
        </div>

        {items.length ? (
          <div className="grid grid-cols-1 gap-8 pt-8 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="font-serif text-lg text-ink">
              No stories in {categoryName} yet.
            </p>
            <p className="meta mt-2 text-muted">
              New articles in this category will appear here as soon as they are
              published.
            </p>
          </div>
        )}

        {total > 12 && (
          <nav
            aria-label="Pagination"
            className="mt-10 flex items-center justify-between border-t border-rule pt-5 font-sans text-sm"
          >
            {page > 1 ? (
              <Link
                href={`?page=${page - 1}`}
                prefetch={true}
                className="meta hover:text-ink"
              >
                ← Previous
              </Link>
            ) : (
              <span />
            )}
            <span className="meta">Page {page}</span>
            {page * 12 < total && (
              <Link
                href={`?page=${page + 1}`}
                prefetch={true}
                className="meta hover:text-ink"
              >
                Next →
              </Link>
            )}
          </nav>
        )}
      </div>
    </>
  );
}

import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { discover } from "@/lib/discovery";
import ArticleCard from "@/components/ArticleCard";
import { siteUrl } from "@/lib/site";
export const dynamic = "force-dynamic";
interface Props {
  params: Promise<{ browse: string[] }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}
export async function generateMetadata({ params, searchParams }: Props) {
  const p = (await params).browse;
  const page = Math.max(1, parseInt((await searchParams).page || "1") || 1);
  return {
    title: p.join(" · "),
    alternates: {
      canonical: siteUrl("/" + p.join("/") + (page > 1 ? `?page=${page}` : "")),
    },
    robots: p[0] === "search" ? { index: false, follow: true } : undefined,
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
  const title =
    kind === "search"
      ? "Find a story"
      : slug
        ? slug.replaceAll("-", " ")
        : kind === "latest"
          ? "The latest"
          : "The archive";
  const href = (p: number) => `?${new URLSearchParams({ q, page: String(p) })}`;
  return (
    <div className="max-w-shell mx-auto px-6 py-12">
      <h1 className="font-serif text-4xl capitalize">{title}</h1>
      {kind === "search" && (
        <form className="my-8 flex gap-3">
          <label className="sr-only" htmlFor="search">
            Search articles
          </label>
          <input
            id="search"
            name="q"
            type="search"
            defaultValue={q}
            maxLength={200}
            placeholder="Search topics, sources, or a phrase…"
            className="border p-3 flex-1 max-w-xl"
          />
          <button className="bg-ink text-paper px-5">Search</button>
        </form>
      )}
      <p className="my-5">
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
        <p className="py-16">
          No published stories here yet. {q ? "Try another phrase." : ""}
        </p>
      )}
      <nav
        className="flex justify-between border-t mt-10 pt-5"
        aria-label="Pagination"
      >
        {page > 1 ? <Link href={href(page - 1)}>← Previous</Link> : <span />}
        <span>Page {page}</span>
        {page * 12 < total ? (
          <Link href={href(page + 1)}>Next →</Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}

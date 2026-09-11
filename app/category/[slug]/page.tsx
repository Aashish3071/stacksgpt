import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/db";
import { discover } from "@/lib/discovery";
import ArticleCard from "@/components/ArticleCard";
import { siteUrl } from "@/lib/site";
interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}
export const dynamic = "force-dynamic";
export async function generateMetadata({ params, searchParams }: Props) {
  const { slug } = await params;
  const page = Math.max(1, parseInt((await searchParams).page || "1") || 1);
  return {
    title: `${slug.replaceAll("-", " ")} news${page > 1 ? ` — Page ${page}` : ""}`,
    alternates: {
      canonical: siteUrl(`/category/${slug}${page > 1 ? `?page=${page}` : ""}`),
    },
  };
}
export default async function Page({ params, searchParams }: Props) {
  const { slug } = await params;
  const category = await prisma.taxonomy.findFirst({
    where: {
      kind: "CATEGORY",
      OR: [
        { slug },
        { name: { equals: slug.replaceAll("-", " "), mode: "insensitive" } },
      ],
    },
  });
  if (!category) notFound();
  const page = Math.max(
    1,
    Math.min(100000, parseInt((await searchParams).page || "1") || 1),
  );
  const { items, total } = await discover({
    page,
    kind: "category",
    slug: category.slug,
  });
  return (
    <div className="mx-auto max-w-shell px-6 py-12">
      <h1 className="font-serif text-4xl">{category.name}</h1>
      <p className="my-5">
        {category.description || `${total} published stories`}
      </p>
      {items.length ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      ) : (
        <p>No stories in this section yet.</p>
      )}
      <nav
        aria-label="Pagination"
        className="flex justify-between mt-10 border-t pt-5"
      >
        {page > 1 ? <Link href={`?page=${page - 1}`}>Previous</Link> : <span />}
        <span>Page {page}</span>
        {page * 12 < total && <Link href={`?page=${page + 1}`}>Next</Link>}
      </nav>
    </div>
  );
}

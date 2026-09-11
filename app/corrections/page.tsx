import { LegalPage } from "@/lib/legal-pages";
import prisma from "@/lib/db";
import Link from "next/link";
import { formatDate } from "@/lib/site";
export const metadata = { title: "Corrections" };
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const page = Math.max(1, parseInt((await searchParams).page || "1") || 1);
  const rows = await prisma.article.findMany({
    where: { isPublished: true, correctionNote: { not: "" } },
    orderBy: { publishedUpdatedAt: "desc" },
    take: 26,
    skip: (page - 1) * 25,
    select: {
      id: true,
      slug: true,
      title: true,
      correctionNote: true,
      publishedUpdatedAt: true,
    },
  });
  return (
    <LegalPage title="Corrections">
      <p>
        Report a factual error through our{" "}
        <Link href="/contact">contact page</Link>. Include the article link, the
        statement in question, and a source supporting the correction.
      </p>
      <p>
        Material corrections receive a visible note on the article and an
        updated date. The original publication date stays visible. Internal
        revision history records the change and its review.
      </p>
      <h2>Published correction notes</h2>
      {rows.length ? (
        rows.slice(0, 25).map((a) => (
          <section key={a.id}>
            <h3>
              <Link href={`/article/${a.slug}`}>{a.title}</Link>
            </h3>
            <p>{a.correctionNote}</p>
            <small>{formatDate(a.publishedUpdatedAt)}</small>
          </section>
        ))
      ) : (
        <p>No correction notes have been published yet.</p>
      )}
      <nav className="flex gap-5">
        {page > 1 && <Link href={`?page=${page - 1}`}>Previous</Link>}
        {rows.length > 25 && <Link href={`?page=${page + 1}`}>Next</Link>}
      </nav>
    </LegalPage>
  );
}

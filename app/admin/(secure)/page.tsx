import prisma from "@/lib/db";
import Link from "next/link";
import { editor } from "@/lib/editor-auth";
export default async function Page() {
  await editor();
  const statuses = [
    "DRAFT",
    "IN_REVIEW",
    "APPROVED",
    "SCHEDULED",
    "PUBLISHED",
    "REJECTED",
  ];
  const counts = await Promise.all(
    statuses.map((status) =>
      prisma.article.count({
        where: { OR: [{ status }, { pendingStatus: status }] },
      }),
    ),
  );
  const [leads, recent, failures] = await Promise.all([
    prisma.rawNews.count({ where: { status: "PENDING" } }),
    prisma.article.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: "desc" },
      take: 6,
    }),
    prisma.channel.findMany({ where: { lastError: { not: null } }, take: 10 }),
  ]);
  return (
    <>
      <h1 className="font-serif text-4xl">Your publication, at a glance.</h1>
      <p className="mt-3 mb-8">
        Antigravity prepares the reporting. Editors decide what goes live.
      </p>
      <div className="grid sm:grid-cols-3 gap-4">
        {statuses.map((s, i) => (
          <Link
            key={s}
            href={`/admin/${({ DRAFT: "drafts", IN_REVIEW: "in-review" } as any)[s] || s.toLowerCase()}`}
            className="border p-5"
          >
            <p>{s.replace("_", " ")}</p>
            <strong className="text-3xl font-serif">{counts[i]}</strong>
          </Link>
        ))}
      </div>
      <Link href="/admin/leads" className="block my-8 underline">
        {leads} new fallback story leads
      </Link>
      <h2 className="text-2xl font-serif my-5">Recently published</h2>
      {recent.map((a) => (
        <Link
          className="block border-b py-4"
          key={a.id}
          href={`/admin/articles/${a.id}`}
        >
          {a.title}
        </Link>
      ))}
      {failures.length > 0 && (
        <>
          <h2 className="text-2xl font-serif mt-8">
            Sources needing attention
          </h2>
          {failures.map((s) => (
            <p key={s.id} className="py-3">
              {s.name}: {s.lastError}
            </p>
          ))}
        </>
      )}
    </>
  );
}

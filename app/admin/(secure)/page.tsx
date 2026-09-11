import prisma from "@/lib/db";
import Link from "next/link";
import { requireEditor } from "@/lib/editor-auth";

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireEditor();

  const statuses = [
    "DRAFT",
    "IN_REVIEW",
    "APPROVED",
    "SCHEDULED",
    "PUBLISHED",
    "REJECTED",
  ];

  let counts: number[] = [0, 0, 0, 0, 0, 0];
  let leads = 0;
  let recent: any[] = [];
  let failures: any[] = [];

  try {
    counts = await Promise.all(
      statuses.map((status) =>
        prisma.article
          .count({
            where: { OR: [{ status }, { pendingStatus: status }] },
          })
          .catch(() => 0),
      ),
    );

    const [leadCount, recentArticles, sourceFailures] = await Promise.all([
      prisma.rawNews.count({ where: { status: "PENDING" } }).catch(() => 0),
      prisma.article
        .findMany({
          where: { isPublished: true },
          orderBy: { publishedAt: "desc" },
          take: 6,
        })
        .catch(() => []),
      prisma.channel
        .findMany({ where: { lastError: { not: null } }, take: 10 })
        .catch(() => []),
    ]);

    leads = leadCount;
    recent = recentArticles;
    failures = sourceFailures;
  } catch (err) {
    console.warn("Could not load full dashboard metrics, using defaults:", err);
  }

  return (
    <>
      <h1 className="font-serif text-4xl">Your publication, at a glance.</h1>
      <p className="mt-3 mb-8 text-muted">
        Antigravity prepares the reporting. Editors decide what goes live.
      </p>

      <div className="grid sm:grid-cols-3 gap-4">
        {statuses.map((s, i) => (
          <Link
            key={s}
            href={`/admin/${({ DRAFT: "drafts", IN_REVIEW: "in-review" } as any)[s] || s.toLowerCase()}`}
            className="border border-rule p-5 hover:border-ink transition-colors"
          >
            <p className="text-sm text-muted">{s.replace("_", " ")}</p>
            <strong className="text-3xl font-serif text-ink">{counts[i] ?? 0}</strong>
          </Link>
        ))}
      </div>

      <Link href="/admin/leads" className="block my-8 underline font-medium">
        {leads} new fallback story leads
      </Link>

      <h2 className="text-2xl font-serif my-5">Recently published</h2>
      {recent.length === 0 ? (
        <p className="text-sm text-muted">No published stories yet.</p>
      ) : (
        recent.map((a) => (
          <Link
            className="block border-b border-rule py-4 hover:underline"
            key={a.id}
            href={`/admin/articles/${a.id}`}
          >
            {a.title}
          </Link>
        ))
      )}

      {failures.length > 0 && (
        <>
          <h2 className="text-2xl font-serif mt-8 text-accent">
            Sources needing attention
          </h2>
          {failures.map((s) => (
            <p key={s.id} className="py-3 text-sm text-muted border-b border-rule">
              <strong className="text-ink">{s.name}</strong>: {s.lastError}
            </p>
          ))}
        </>
      )}
    </>
  );
}

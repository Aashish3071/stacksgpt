import { requireEditor } from "@/lib/editor-auth";
import prisma from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  await requireEditor();
  const requested = Number((await searchParams).days || 7);
  const days = [7, 30, 90].includes(requested) ? requested : 7;
  const start = new Date(Date.now() - days * 86400000);
  const since = start.toISOString().slice(0, 10);

  let totals: any[] = [];
  let top: any[] = [];
  let decisions: any[] = [];
  let failures = 0;
  let articles: any[] = [];

  try {
    const [t, tp, d, f] = await Promise.all([
      prisma.eventDaily
        .groupBy({
          by: ["event"],
          where: { day: { gte: since } },
          _sum: { count: true },
        })
        .catch(() => []),
      prisma.eventDaily
        .groupBy({
          by: ["articleId"],
          where: {
            day: { gte: since },
            event: "article_view",
            articleId: { not: "" },
          },
          _sum: { count: true },
          orderBy: { _sum: { count: "desc" } },
          take: 10,
        })
        .catch(() => []),
      prisma.auditLog
        .groupBy({
          by: ["action"],
          where: {
            createdAt: { gte: start },
            action: { in: ["PUBLISH", "APPROVE", "REJECT"] },
          },
          _count: { _all: true },
        })
        .catch(() => []),
      prisma.importAttempt
        .count({
          where: { status: "REJECTED", createdAt: { gte: start } },
        })
        .catch(() => 0),
    ]);

    totals = t;
    top = tp;
    decisions = d;
    failures = f;

    const articleIds = top.map((item: any) => item.articleId).filter(Boolean);
    if (articleIds.length > 0) {
      articles = await prisma.article
        .findMany({
          where: { id: { in: articleIds } },
          select: { id: true, title: true, slug: true },
        })
        .catch(() => []);
    }
  } catch (err) {
    console.warn("Could not load analytics metrics, using defaults:", err);
  }

  return (
    <>
      <h1 className="font-serif text-4xl">Editorial reporting</h1>
      <nav className="flex gap-4 my-5 text-sm font-sans">
        {[7, 30, 90].map((n) => (
          <Link
            key={n}
            className={`transition-colors ${days === n ? "font-bold underline text-ink" : "text-muted hover:text-ink"}`}
            href={`?days=${n}`}
          >
            Last {n} days
          </Link>
        ))}
      </nav>
      <p className="mb-8 text-sm text-muted">
        Counts cover readers who opted into analytics. They are event counts,
        not unique people. A low count can reflect consent choices or disabled
        analytics.
      </p>
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          ["article_view", "Article views"],
          ["engaged_30s", "Reads lasting 30 seconds"],
          ["scroll_75", "75% scroll depth"],
          ["outbound_click", "Source and external clicks"],
          ["search", "Search visits"],
        ].map(([key, label]) => (
          <section key={key} className="border border-rule p-5">
            <h2 className="text-sm text-muted">{label}</h2>
            <p className="font-serif text-4xl mt-3 text-ink">
              {totals.find((t) => t.event === key)?._sum?.count || 0}
            </p>
          </section>
        ))}
      </div>
      <h2 className="font-serif text-2xl mt-10 mb-4">Editorial activity</h2>
      <div className="flex flex-wrap gap-6 text-sm text-muted">
        {decisions.map((d: any) => (
          <p key={d.action}>
            {d.action.toLowerCase()}:{" "}
            <strong className="text-ink">{d._count?._all || 0}</strong>
          </p>
        ))}
        <p>
          Rejected imports: <strong className="text-ink">{failures}</strong>
        </p>
      </div>
      <h2 className="font-serif text-2xl mt-10 mb-4">Most-read articles</h2>
      {top.length ? (
        <ol className="space-y-4 text-sm">
          {top.map((t: any) => (
            <li
              className="flex gap-5 justify-between border-b border-rule py-3"
              key={t.articleId}
            >
              <Link
                className="underline hover:text-ink"
                href={`/admin/articles/${t.articleId}`}
              >
                {articles.find((a) => a.id === t.articleId)?.title ||
                  "Archived article"}
              </Link>
              <span className="text-muted">{t._sum?.count || 0} views</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-muted">
          No consented views have been recorded during this period.
        </p>
      )}
    </>
  );
}

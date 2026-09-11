import { editor } from "@/lib/editor-auth";
import prisma from "@/lib/db";
import Link from "next/link";
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  await editor();
  const requested = Number((await searchParams).days || 7);
  const days = [7, 30, 90].includes(requested) ? requested : 7;
  const start = new Date(Date.now() - days * 86400000);
  const since = start.toISOString().slice(0, 10);
  const [totals, top, decisions, failures] = await Promise.all([
    prisma.eventDaily.groupBy({
      by: ["event"],
      where: { day: { gte: since } },
      _sum: { count: true },
    }),
    prisma.eventDaily.groupBy({
      by: ["articleId"],
      where: {
        day: { gte: since },
        event: "article_view",
        articleId: { not: "" },
      },
      _sum: { count: true },
      orderBy: { _sum: { count: "desc" } },
      take: 10,
    }),
    prisma.auditLog.groupBy({
      by: ["action"],
      where: {
        createdAt: { gte: start },
        action: { in: ["PUBLISH", "APPROVE", "REJECT"] },
      },
      _count: { _all: true },
    }),
    prisma.importAttempt.count({
      where: { status: "REJECTED", createdAt: { gte: start } },
    }),
  ]);
  const articles = await prisma.article.findMany({
    where: { id: { in: top.map((t) => t.articleId) } },
    select: { id: true, title: true, slug: true },
  });
  return (
    <>
      <h1 className="font-serif text-4xl">Editorial reporting</h1>
      <nav className="flex gap-4 my-5">
        {[7, 30, 90].map((n) => (
          <Link
            key={n}
            className={days === n ? "font-bold underline" : ""}
            href={`?days=${n}`}
          >
            Last {n} days
          </Link>
        ))}
      </nav>
      <p className="mb-8">
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
          <section key={key} className="border p-5">
            <h2>{label}</h2>
            <p className="font-serif text-4xl mt-3">
              {totals.find((t) => t.event === key)?._sum.count || 0}
            </p>
          </section>
        ))}
      </div>
      <h2 className="font-serif text-2xl mt-10 mb-4">Editorial activity</h2>
      <div className="flex flex-wrap gap-6">
        {decisions.map((d) => (
          <p key={d.action}>
            {d.action.toLowerCase()}: <strong>{d._count._all}</strong>
          </p>
        ))}
        <p>
          Rejected imports: <strong>{failures}</strong>
        </p>
      </div>
      <h2 className="font-serif text-2xl mt-10 mb-4">Most-read articles</h2>
      {top.length ? (
        <ol className="space-y-4">
          {top.map((t) => (
            <li
              className="flex gap-5 justify-between border-b py-3"
              key={t.articleId}
            >
              <Link
                className="underline"
                href={`/admin/articles/${t.articleId}`}
              >
                {articles.find((a) => a.id === t.articleId)?.title ||
                  "Archived article"}
              </Link>
              <span>{t._sum.count} views</span>
            </li>
          ))}
        </ol>
      ) : (
        <p>No consented views have been recorded during this period.</p>
      )}
    </>
  );
}

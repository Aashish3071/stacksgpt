import { admin } from "@/lib/editor-auth";
import prisma from "@/lib/db";
import { safeMarkdown } from "@/lib/safe-markdown";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await admin();
  const n = await prisma.newsletter.findUnique({
    where: { id: (await params).id },
  });
  if (!n) notFound();
  const counts = await prisma.newsletterDelivery.groupBy({
    by: ["status"],
    where: { newsletterId: n.id },
    _count: { _all: true },
  });
  const failed = await prisma.newsletterDelivery.findMany({
    where: { newsletterId: n.id, status: { in: ["FAILED", "PROCESSING"] } },
    take: 100,
  });
  return (
    <>
      <h1 className="font-serif text-3xl">{n.subject}</h1>
      <p className="my-5">{n.status}</p>
      <div
        className="article-prose border p-6"
        dangerouslySetInnerHTML={{ __html: await safeMarkdown(n.body) }}
      />
      <h2 className="font-serif text-2xl mt-8">Delivery report</h2>
      <ul className="my-5">
        {counts.map((c) => (
          <li key={c.status}>
            {c.status}: {c._count._all}
          </li>
        ))}
      </ul>
      {failed.length > 0 && (
        <>
          <p>
            Failed or interrupted sends need inspection in the email provider’s
            logs before any retry, to avoid duplicate emails.
          </p>
          <ul>
            {failed.map((d) => (
              <li key={d.id} className="border-b py-3">
                Subscriber {d.subscriberId}: {d.status}. {d.error}
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

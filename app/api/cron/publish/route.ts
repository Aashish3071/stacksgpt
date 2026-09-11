import { deliverNewsletterBatch } from "@/lib/newsletter";
import { requireSecret } from "@/lib/security";
import prisma from "@/lib/db";
import { transitionArticle } from "@/lib/editorial";
import { revalidatePath } from "next/cache";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function GET(req: Request) {
  try {
    requireSecret(req, "CRON_SECRET");
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const results = [];
  const started = Date.now();
  try {
    const due = await prisma.article.findMany({
      where: {
        OR: [{ status: "SCHEDULED" }, { pendingStatus: "SCHEDULED" }],
        scheduledFor: { lte: new Date() },
        reviewedBy: { not: null },
      },
      take: 5,
      orderBy: { scheduledFor: "asc" },
    });
    for (const a of due) {
      if (Date.now() - started > 25000) break;
      try {
        await transitionArticle(a.id, "publish", a.reviewedBy!, a.version);
        results.push({ id: a.id, ok: true });
      } catch (e) {
        const message = e instanceof Error ? e.message : "Publication failed";
        results.push({ id: a.id, error: message });
        if (a.rejectionReason !== message) {
          const saved = await prisma.article.updateMany({
            where: { id: a.id, version: a.version },
            data: { rejectionReason: message },
          });
          if (saved.count)
            await prisma.auditLog.create({
              data: {
                actorId: a.reviewedBy,
                action: "SCHEDULE_FAILED",
                articleId: a.id,
                detail: { message },
              },
            });
        }
      }
    }
    if (results.some((x) => x.ok)) revalidatePath("/", "layout");
    await prisma.rateLimit.deleteMany({
      where: { expiresAt: { lt: new Date(Date.now() - 86400000) } },
    });
    await prisma.eventDaily.deleteMany({
      where: {
        day: {
          lt: new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10),
        },
      },
    });
    const newsletters =
      Date.now() - started < 25000
        ? await deliverNewsletterBatch()
        : { deferred: true };
    return Response.json({ results, newsletters });
  } catch {
    return Response.json({ error: "Maintenance failed." }, { status: 500 });
  }
}

import prisma from "@/lib/db";
import { requireSecret } from "@/lib/security";
import { getSettings } from "@/lib/settings";
export async function GET(req: Request) {
  try {
    requireSecret(req, "INGEST_SECRET");
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await getSettings()).rssFallbackEnabled)
    return Response.json({ leads: [], disabled: true });
  const leads = await prisma.rawNews.findMany({
    where: {
      status: { in: ["SHORTLISTED", "SELECTED", "PENDING"] },
      duplicateOf: null,
    },
    take: 25,
    orderBy: [{ score: "desc" }, { publishedAt: "desc" }],
    select: {
      id: true,
      title: true,
      externalUrl: true,
      author: true,
      notes: true,
      publishedAt: true,
      status: true,
      score: true,
    },
  });
  return Response.json({ leads }, { headers: { "Cache-Control": "no-store" } });
}

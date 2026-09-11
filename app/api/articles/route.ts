import prisma from "@/lib/db";
import { editor } from "@/lib/editor-auth";
import { limitedJson, sameOrigin } from "@/lib/security";
import { saveDraft, transitionArticle } from "@/lib/editorial";
import { revalidatePath } from "next/cache";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    await editor();
    const p = new URL(req.url).searchParams;
    const page = Math.max(1, parseInt(p.get("page") || "1") || 1);
    const status = p.get("status");
    const where: any = status
      ? { OR: [{ status }, { pendingStatus: status }] }
      : {};
    if (p.get("q")) where.title = { contains: p.get("q"), mode: "insensitive" };
    const [articles, total] = await prisma.$transaction([
      prisma.article.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 25,
        skip: (page - 1) * 25,
      }),
      prisma.article.count({ where }),
    ]);
    return Response.json({ articles, total, page });
  } catch (e) {
    return Response.json(
      { error: String(e instanceof Error ? e.message : e) },
      { status: 401 },
    );
  }
}
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const p = await editor();
    return Response.json({
      article: await saveDraft(await limitedJson(req), p.id),
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Cannot save draft" },
      {
        status: e instanceof Error && e.message === "Unauthorized" ? 401 : 400,
      },
    );
  }
}
export async function PATCH(req: Request) {
  try {
    sameOrigin(req);
    const p = await editor();
    const body = await limitedJson(req);
    if (!body.id) throw Error("Article ID is required.");
    const article = body.action
      ? await transitionArticle(
          body.id,
          body.action,
          p.id,
          body.version,
          body.when,
          body.reason,
          body.checks,
        )
      : await saveDraft(body, p.id);
    for (const path of [
      "/",
      "/latest",
      "/archive",
      "/search",
      "/sitemap.xml",
      "/feed.xml",
      "/category",
      "/tag",
      "/source",
      "/audience",
    ])
      revalidatePath(path, "layout");
    revalidatePath(`/article/${article.slug}`);
    return Response.json({ success: true, article });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Cannot update article" },
      {
        status: e instanceof Error && e.message === "Unauthorized" ? 401 : 400,
      },
    );
  }
}
export async function DELETE() {
  return Response.json(
    { error: "Use Archive to retain editorial history." },
    { status: 405 },
  );
}

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

const VALID_STATUSES = new Set(["DRAFT", "NEEDS_EDIT", "PUBLISHED", "REJECTED"]);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const articles = await prisma.article.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        primaryTool: { select: { name: true, slug: true, status: true } },
        rawNews: { select: { title: true, rawText: true, externalUrl: true, author: true, score: true } },
      },
    });

    return NextResponse.json({ articles });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * Review actions: edit the copy and/or move an article through the queue.
 * Publishing is only ever reachable here, never from the ingestion pipeline.
 */
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, title, summary, verdict, category, seoTitle, metaDescription } = body;

    if (!id) return NextResponse.json({ error: "Missing article id" }, { status: 400 });

    const data: Record<string, unknown> = {};

    if (typeof title === "string" && title.trim()) data.title = title.trim();
    if (typeof summary === "string" && summary.trim()) data.summary = summary.trim();
    if (typeof verdict === "string" && verdict.trim()) data.verdict = verdict.trim();
    if (typeof category === "string" && category.trim()) data.category = category.trim();
    if (typeof seoTitle === "string") data.seoTitle = seoTitle.trim() || null;
    if (typeof metaDescription === "string") data.metaDescription = metaDescription.trim() || null;

    if (status) {
      if (!VALID_STATUSES.has(status)) {
        return NextResponse.json({ error: `Unknown status "${status}"` }, { status: 400 });
      }

      const existing = await prisma.article.findUnique({
        where: { id },
        select: { publishedAt: true },
      });

      data.status = status;
      data.isPublished = status === "PUBLISHED";
      // Keep the original publication date if it is being re-published.
      data.publishedAt =
        status === "PUBLISHED" ? existing?.publishedAt ?? new Date() : null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const article = await prisma.article.update({ where: { id }, data });

    // Push the change live immediately instead of waiting out the ISR window,
    // so approving in the review queue shows up on the site straight away.
    revalidatePath("/");
    revalidatePath(`/article/${article.slug}`);
    revalidatePath(`/category/${article.category.toLowerCase()}`);
    revalidatePath("/sitemap.xml");

    return NextResponse.json({ success: true, article });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing article id" }, { status: 400 });

    await prisma.article.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

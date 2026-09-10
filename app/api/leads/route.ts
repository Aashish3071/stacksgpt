import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Scored story leads collected by the ingestion run.
 *
 * This is the hand-off point to the external writing agents: the feeds find and
 * rank candidate stories, and you pass the interesting URLs to Antigravity.
 * Admin-only, because it exposes the editorial pipeline.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 40, 200);

    const leads = await prisma.rawNews.findMany({
      where: { status: "PENDING" },
      orderBy: [{ score: "desc" }, { publishedAt: "desc" }],
      take: limit,
      select: {
        id: true,
        title: true,
        externalUrl: true,
        author: true,
        score: true,
        publishedAt: true,
        rawText: true,
        channel: { select: { name: true, category: true } },
      },
    });

    return NextResponse.json({ leads });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/** Dismiss a lead you do not intend to cover, so it stops appearing. */
export async function PATCH(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing lead id" }, { status: 400 });

    await prisma.rawNews.update({ where: { id }, data: { status: "IGNORED" } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Partner-link redirect with click counting.
 *
 * Only ever redirects to a hand-entered, approved partner URL on an ACTIVE tool.
 * Anything else 404s rather than redirecting — an endpoint that forwards to
 * arbitrary stored strings is an open redirect, which gets abused for phishing.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const tool = await prisma.toolAffiliate.findUnique({
      where: { slug: (await params).slug },
      select: { id: true, affiliateUrl: true, status: true },
    });

    if (
      !tool ||
      tool.status !== "ACTIVE" ||
      !tool.affiliateUrl ||
      !(await prisma.partnerLink.findFirst({
        where: {
          url: tool.affiliateUrl,
          active: true,
          partner: { active: true },
        },
      }))
    ) {
      return NextResponse.json(
        { error: "No partner link for this tool." },
        { status: 404 },
      );
    }

    let target: URL;
    try {
      target = new URL(tool.affiliateUrl);
    } catch {
      console.error(
        `[affiliate] "${(await params).slug}" has an unparseable URL.`,
      );
      return NextResponse.json(
        { error: "Invalid partner link." },
        { status: 404 },
      );
    }

    if (target.protocol !== "https:" && target.protocol !== "http:") {
      console.error(
        `[affiliate] "${(await params).slug}" blocked: protocol ${target.protocol}`,
      );
      return NextResponse.json(
        { error: "Invalid partner link." },
        { status: 404 },
      );
    }

    return NextResponse.redirect(target.toString(), 307);
  } catch (error) {
    console.error("[affiliate] redirect error:", error);
    return NextResponse.json({ error: "Redirect failed." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tools = await prisma.toolAffiliate.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    return NextResponse.json({ tools });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * The only route that can attach a partner link, and it is admin-only.
 * A link must be a valid http(s) URL, entered by hand, after a real agreement.
 */
export async function PATCH(req: Request) {
  try {
    const { id, affiliateUrl, status, discountCode } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing tool id" }, { status: 400 });

    const data: Record<string, unknown> = {};

    if (affiliateUrl !== undefined) {
      const raw = String(affiliateUrl || "").trim();
      if (!raw) {
        data.affiliateUrl = null;
        data.status = "NONE";
      } else {
        let parsed: URL;
        try {
          parsed = new URL(raw);
        } catch {
          return NextResponse.json({ error: "That is not a valid URL." }, { status: 400 });
        }
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
          return NextResponse.json({ error: "Link must be http or https." }, { status: 400 });
        }
        data.affiliateUrl = parsed.toString();
      }
    }

    if (status !== undefined) {
      if (!["ACTIVE", "NONE"].includes(status)) {
        return NextResponse.json({ error: `Unknown status "${status}"` }, { status: 400 });
      }
      // Cannot mark a tool ACTIVE without a link to send readers to.
      if (status === "ACTIVE") {
        const target = data.affiliateUrl as string | null | undefined;
        if (target === null) {
          return NextResponse.json(
            { error: "Add a partner link before marking this tool active." },
            { status: 400 }
          );
        }
        if (target === undefined) {
          const existing = await prisma.toolAffiliate.findUnique({
            where: { id },
            select: { affiliateUrl: true },
          });
          if (!existing?.affiliateUrl) {
            return NextResponse.json(
              { error: "Add a partner link before marking this tool active." },
              { status: 400 }
            );
          }
        }
      }
      data.status = status;
    }

    if (discountCode !== undefined) {
      const code = String(discountCode || "").trim();
      data.discountCode = code || null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const tool = await prisma.toolAffiliate.update({ where: { id }, data });
    return NextResponse.json({ success: true, tool });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

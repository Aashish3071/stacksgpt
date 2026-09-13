import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { signMemberId } from "@/lib/member";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const slug = typeof body.slug === "string" ? body.slug.trim() : "";

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { ok: false, error: "Valid email address is required." },
        { status: 400 },
      );
    }

    // Try recording or finding subscriber if table is available, otherwise encode email
    let subscriberId = Buffer.from(email).toString("base64url");
    try {
      const sub = await prisma.subscriber.upsert({
        where: { email },
        create: {
          email,
          source: slug ? `blueprint:${slug}` : "blueprint_unlock",
        },
        update: {},
      });
      subscriberId = sub.id;
    } catch (e) {
      console.warn("Subscriber table upsert skipped in local test mode:", e);
    }

    // Increment unlock count if slug is provided
    if (slug) {
      try {
        await prisma.blueprint.update({
          where: { slug },
          data: { unlockCount: { increment: 1 } },
        });
      } catch (err) {
        console.warn("Could not increment blueprint unlock count:", err);
      }
    }

    const token = signMemberId(subscriberId);
    const response = NextResponse.json({ ok: true, unlocked: true });

    response.cookies.set("sgpt_member", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    return response;
  } catch (error) {
    console.error("Blueprint unlock failed:", error);
    return NextResponse.json(
      { ok: false, error: "Unlock could not be processed." },
      { status: 500 },
    );
  }
}

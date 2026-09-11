import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase, AUTH_COOKIE } from "@/lib/editor-auth";
import { sameOrigin, limitedJson, rateLimit } from "@/lib/security";
import prisma from "@/lib/db";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    await rateLimit(req, "login", 8);
    const { email, password } = await limitedJson(req, 3000);
    if (typeof email !== "string" || typeof password !== "string")
      throw Error("Email and password are required.");
    const { data, error } = await supabase().auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.session)
      throw Error("Sign-in failed. Check your email and password.");
    const profile = await prisma.profile.findUnique({
      where: { id: data.user.id },
    });
    if (!profile?.active)
      throw Error("This account has not been granted newsroom access.");
    const res = NextResponse.json({ ok: true });
    const opts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      path: "/",
    };
    res.cookies.set(AUTH_COOKIE, data.session.access_token, {
      ...opts,
      maxAge: data.session.expires_in,
    });
    res.cookies.set("stacksgpt_refresh", data.session.refresh_token, {
      ...opts,
      path: "/api",
      maxAge: 86400 * 7,
    });
    return res;
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Sign-in failed" },
      { status: 401 },
    );
  }
}
export async function DELETE(req: Request) {
  try {
    sameOrigin(req);
    const token = (await cookies()).get(AUTH_COOKIE)?.value;
    if (token)
      await fetch(`${process.env.SUPABASE_URL}/auth/v1/logout`, {
        method: "POST",
        headers: {
          apikey: process.env.SUPABASE_PUBLISHABLE_KEY!,
          Authorization: `Bearer ${token}`,
        },
      });
    const res = NextResponse.json({ ok: true });
    res.cookies.delete(AUTH_COOKIE);
    res.cookies.set("stacksgpt_refresh", "", { path: "/api", maxAge: 0 });
    return res;
  } catch {
    return NextResponse.json({ error: "Sign-out failed" }, { status: 400 });
  }
}

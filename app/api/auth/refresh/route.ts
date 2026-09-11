import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabase, AUTH_COOKIE } from "@/lib/editor-auth";
import { sameOrigin } from "@/lib/security";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const token = (await cookies()).get("stacksgpt_refresh")?.value;
    if (!token) throw Error("Sign in again.");
    const { data, error } = await supabase().auth.refreshSession({
      refresh_token: token,
    });
    if (error || !data.session) throw Error("Sign in again.");
    const res = NextResponse.json({ ok: true });
    const o = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      path: "/",
    };
    res.cookies.set(AUTH_COOKIE, data.session.access_token, {
      ...o,
      maxAge: data.session.expires_in,
    });
    res.cookies.set("stacksgpt_refresh", data.session.refresh_token, {
      ...o,
      path: "/api",
      maxAge: 86400 * 7,
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Sign in again." }, { status: 401 });
  }
}

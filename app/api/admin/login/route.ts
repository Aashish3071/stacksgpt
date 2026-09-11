import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase, AUTH_COOKIE, createMasterSession } from "@/lib/editor-auth";
import { sameOrigin, limitedJson, rateLimit } from "@/lib/security";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    sameOrigin(req);
    await rateLimit(req, "login", 15);

    const { email, password } = await limitedJson(req, 3000);
    if (typeof email !== "string" || typeof password !== "string") {
      throw Error("Email and password are required.");
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // 1. Master password authentication. No hardcoded fallback: a default
    // committed to a public repo would let anyone log in as admin.
    const masterPassword = process.env.ADMIN_PASSWORD?.trim();

    if (masterPassword && cleanPassword === masterPassword) {
      const token = createMasterSession(cleanEmail);
      const res = NextResponse.json({ ok: true });
      res.cookies.set(AUTH_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 86400 * 7,
      });
      return res;
    }

    // 2. Direct PostgreSQL authentication check (independent of Supabase HTTP service)
    let dbAuthenticated: { id: string } | null = null;
    try {
      const rows = await prisma.$queryRaw<
        Array<{ id: string; email: string; valid: boolean }>
      >`
        SELECT id, email, (encrypted_password = extensions.crypt(${cleanPassword}, encrypted_password)) as valid
        FROM auth.users
        WHERE lower(email) = lower(${cleanEmail})
        LIMIT 1
      `;
      if (rows && rows.length > 0 && rows[0].valid)
        dbAuthenticated = { id: rows[0].id };
    } catch (dbErr) {
      // Only infrastructure failures fall through to the Supabase path; a
      // rejected credential must not be retried as if nothing happened.
      console.warn("Direct database auth check error:", dbErr);
    }

    if (dbAuthenticated) {
      // Authenticating proves who you are, not what you may do. This branch
      // used to upsert the caller to role ADMIN + active:true, which promoted
      // any EDITOR to ADMIN on sign-in and let a deactivated account
      // reactivate itself. Authorization must come from an existing Profile.
      const profile = await prisma.profile.findUnique({
        where: { id: dbAuthenticated.id },
      });
      if (
        !profile?.active ||
        (profile.role !== "ADMIN" && profile.role !== "EDITOR")
      )
        throw Error("This account does not have newsroom access.");

      const token = createMasterSession(cleanEmail, profile.role);
      const res = NextResponse.json({ ok: true });
      res.cookies.set(AUTH_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 86400 * 7,
      });
      return res;
    }

    // 3. Fallback: Supabase GoTrue Auth
    try {
      const { data, error } = await supabase().auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (!error && data?.session) {
        const profile = await prisma.profile.findUnique({
          where: { id: data.user.id },
        });
        if (
          profile?.active &&
          (profile.role === "ADMIN" || profile.role === "EDITOR")
        ) {
          const res = NextResponse.json({ ok: true });
          const opts = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax" as const,
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
        }
      }
    } catch (sbErr) {
      console.warn("Supabase auth fallback error:", sbErr);
    }

    throw Error("Sign-in failed. Please verify your email and password.");
  } catch (e) {
    // Never echo the internal reason to an unauthenticated caller: it leaked
    // server configuration ("ADMIN_SESSION_SECRET is not configured") and
    // whether a given account exists. Operators read the real cause in the
    // function logs. Rate limiting is the one message worth surfacing, since
    // the caller needs to know to back off rather than retry.
    const message = e instanceof Error ? e.message : "Sign-in failed";
    console.warn("Admin sign-in failed:", message);
    const rateLimited = message.startsWith("Too many requests");
    return NextResponse.json(
      {
        error: rateLimited
          ? message
          : "Sign-in failed. Please verify your email and password.",
      },
      { status: rateLimited ? 429 : 401 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    sameOrigin(req);
    const token = (await cookies()).get(AUTH_COOKIE)?.value;
    if (token && process.env.SUPABASE_URL) {
      try {
        await fetch(`${process.env.SUPABASE_URL}/auth/v1/logout`, {
          method: "POST",
          headers: {
            apikey: process.env.SUPABASE_PUBLISHABLE_KEY || "",
            Authorization: `Bearer ${token}`,
          },
        });
      } catch {}
    }
  } catch {}
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(AUTH_COOKIE);
  res.cookies.delete("stacksgpt_refresh");
  return res;
}

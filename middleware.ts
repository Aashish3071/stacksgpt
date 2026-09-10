import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

/**
 * Gate for everything that can change the site.
 *
 * Without this, /admin and the mutating API routes are usable by anyone who
 * finds the URL — they could publish, edit or delete articles at will.
 */

const PUBLIC_API_PREFIXES = [
  "/api/admin/login",
  "/api/cron/", // guarded separately by CRON_SECRET
  "/api/subscribe", // public newsletter signup
  "/api/views", // public pageview beacon
  "/api/affiliate/", // public outbound redirect
];

/** Methods that only read. Public GETs stay open so pages still render. */
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const PROTECTED_READ_PREFIXES = [
  "/api/articles",
  "/api/channels",
  "/api/tools",
  "/api/pipeline",
  "/api/leads",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authed = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);

  // Admin pages: redirect to login rather than showing a broken shell.
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();
    if (!authed) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (!pathname.startsWith("/api/")) return NextResponse.next();

  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Admin-only API surface: both reads and writes require a session, since the
  // read endpoints expose unpublished drafts.
  const isProtectedRead = PROTECTED_READ_PREFIXES.some((p) => pathname.startsWith(p));
  if (!SAFE_METHODS.has(req.method) || isProtectedRead) {
    if (!authed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};

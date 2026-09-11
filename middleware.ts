import { NextRequest, NextResponse } from "next/server";
const publicApi = [
  "/api/admin/login",
  "/api/auth/refresh",
  "/api/import/",
  "/api/cron/",
  "/api/subscribe",
  "/api/newsletter/",
  "/api/events",
  "/api/views",
  "/api/affiliate/",
  "/api/partners/",
];
export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (
    path.startsWith("/admin") &&
    path !== "/admin/login" &&
    !req.cookies.get("stacksgpt_session")
  )
    return NextResponse.redirect(new URL("/admin/login", req.url));
  if (
    path.startsWith("/api/") &&
    !publicApi.some(
      (p) => path === p || (p.endsWith("/") && path.startsWith(p)),
    )
  ) {
    if (!req.cookies.get("stacksgpt_session"))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const origin = req.headers.get("origin");
    if (origin && !["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      try {
        const originUrl = new URL(origin);
        const originHost = originUrl.host.toLowerCase();
        const reqHost = (
          req.headers.get("x-forwarded-host") ||
          req.headers.get("host") ||
          req.nextUrl.host
        ).toLowerCase();

        const isAllowed =
          originHost === reqHost ||
          originUrl.origin === req.nextUrl.origin ||
          originHost === "stacksgpt.com" ||
          originHost.endsWith(".stacksgpt.com") ||
          originHost.endsWith(".vercel.app") ||
          originHost.startsWith("localhost");

        if (!isAllowed) {
          return NextResponse.json(
            { error: "Invalid request origin" },
            { status: 403 },
          );
        }
      } catch {
        return NextResponse.json(
          { error: "Invalid request origin" },
          { status: 403 },
        );
      }
    }
  }
  const res = NextResponse.next();
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  if (path.startsWith("/newsletter/"))
    res.headers.set("Referrer-Policy", "no-referrer");
  if (
    path.startsWith("/admin") ||
    path.startsWith("/api/") ||
    path.startsWith("/newsletter/")
  ) {
    res.headers.set("Cache-Control", "private, no-store");
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return res;
}
export const config = {
  matcher: ["/admin/:path*", "/api/:path*", "/newsletter/:path*"],
};

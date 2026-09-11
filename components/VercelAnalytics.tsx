"use client";

import { usePathname } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function VercelAnalytics() {
  const pathname = usePathname();
  const isPrivate =
    pathname?.startsWith("/admin") || pathname?.startsWith("/newsletter/");

  if (isPrivate) {
    return null;
  }

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}

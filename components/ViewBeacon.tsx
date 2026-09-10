"use client";

import { useEffect } from "react";

/**
 * Records a pageview from the client after render.
 *
 * Counting in the server component instead would fire on every crawler hit and
 * force the page out of the static cache, which costs both rankings and ad revenue.
 */
export default function ViewBeacon({ slug }: { slug: string }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      fetch("/api/views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
        keepalive: true,
      }).catch(() => {
        /* a missed view count is not worth surfacing to the reader */
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [slug]);

  return null;
}

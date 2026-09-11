"use client";
import { useEffect } from "react";
import { usePrivacy, track } from "./PrivacyControls";
export default function ViewBeacon({ slug }: { slug: string }) {
  const { analytics } = usePrivacy();
  useEffect(() => {
    if (!analytics) return;
    const sent = new Set<string>();
    const once = (event: string) => {
      if (!sent.has(event)) {
        sent.add(event);
        track(event, slug);
      }
    };
    const timer = setTimeout(() => once("article_view"), 1500);
    const engaged = setTimeout(() => once("engaged_30s"), 30000);
    let ticking = false;
    const scroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const length =
            document.documentElement.scrollHeight - window.innerHeight;
          if (length > 0 && window.scrollY / length >= 0.75) once("scroll_75");
          ticking = false;
        });
        ticking = true;
      }
    };
    const click = (e: MouseEvent) => {
      const link = (e.target as Element)?.closest("a");
      if (link?.hostname && link.hostname !== location.hostname)
        once("outbound_click");
    };
    addEventListener("scroll", scroll, { passive: true });
    document.addEventListener("click", click);
    return () => {
      clearTimeout(timer);
      clearTimeout(engaged);
      removeEventListener("scroll", scroll);
      document.removeEventListener("click", click);
    };
  }, [slug, analytics]);
  return null;
}

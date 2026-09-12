"use client";
import { useEffect, useRef } from "react";
import {
  AD_SIZES,
  AD_UNITS,
  PLACEMENT_FORMAT,
  AdPlacement,
} from "@/lib/ad-config";
import { usePrivacy } from "./PrivacyControls";

/**
 * One deliberate ad placement.
 *
 * Deliberate is the point: Auto ads used to decide placement itself by
 * scanning the DOM, and on mobile it appended units below the footer, leaving
 * around 1,200px of blank page to scroll through. Every unit now sits where
 * this component is mounted and nowhere else.
 *
 * The AdSense library is loaded once in app/layout.tsx. This component must
 * not load it again — it previously rendered its own <Script> per slot, which
 * is how the page ended up requesting adsbygoogle.js four times.
 */
export default function AdSlot({
  placement,
  className = "",
}: {
  placement: AdPlacement;
  className?: string;
}) {
  const { ads, settings } = usePrivacy();
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const size = AD_SIZES[placement];
  const unit = AD_UNITS[PLACEMENT_FORMAT[placement]];
  // A slot configured in the newsroom settings wins over the built-in default.
  const slot = settings.adUnits?.[placement] || unit.slot;
  const client = settings.adsenseId;
  const live = ads && settings.adsProvider === "adsense" && !!client && !!slot;

  useEffect(() => {
    if (!live || pushed.current) return;
    // React can re-run effects; pushing the same slot twice makes AdSense
    // throw "All ins elements in the DOM with class=adsbygoogle already have
    // ads in them" and the unit never fills.
    pushed.current = true;
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {}
  }, [live]);

  if (settings.adsProvider === "disabled") return null;
  // Render nothing at all rather than an empty reserved box when ads are off
  // or consent has not been given — an empty box is the dead space we just
  // spent time removing.
  if (settings.adsProvider === "placeholder")
    return (
      <aside
        aria-label="Advertisement"
        className={`ad-slot my-8 ${className}`}
        style={
          {
            "--ad-h-mobile": `${size.mobile.height}px`,
            "--ad-h-desktop": `${size.desktop.height}px`,
          } as React.CSSProperties
        }
      >
        <p className="text-center text-xs text-muted">Advertisement</p>
        <div className="ad-slot__inner border border-dashed flex items-center justify-center text-muted">
          {size.label} · {unit.format}
        </div>
      </aside>
    );
  if (!live) return null;

  return (
    <aside aria-label="Advertisement" className={`ad-slot my-8 ${className}`}>
      <p className="text-center text-xs text-muted">Advertisement</p>
      <ins
        ref={ref}
        className="adsbygoogle block w-full"
        style={
          unit.format === "in-article"
            ? { display: "block", textAlign: "center" }
            : { display: "block" }
        }
        data-ad-client={client}
        data-ad-slot={slot}
        {...(unit.format === "display"
          ? { "data-ad-format": "auto", "data-full-width-responsive": "true" }
          : unit.format === "in-feed"
            ? { "data-ad-format": "fluid", "data-ad-layout-key": unit.layoutKey }
            : { "data-ad-format": "fluid", "data-ad-layout": "in-article" })}
      />
    </aside>
  );
}

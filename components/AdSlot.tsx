"use client";
import Script from "next/script";
import { useEffect, useRef } from "react";
import { AD_SIZES, AdPlacement } from "@/lib/ad-config";
import { usePrivacy } from "./PrivacyControls";
export default function AdSlot({
  placement,
  className = "",
}: {
  placement: AdPlacement;
  className?: string;
}) {
  const { ads, settings } = usePrivacy();
  const ref = useRef<HTMLModElement>(null);
  const size = AD_SIZES[placement];
  const slot = settings.adUnits?.[placement];
  useEffect(() => {
    if (ads && slot && settings.adsProvider === "adsense") {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push(
          {},
        );
      } catch {}
    }
  }, [ads, slot, settings.adsProvider]);
  if (!ads || settings.adsProvider === "disabled") return null;
  if (settings.adsProvider === "adsense" && (!slot || !settings.adsenseId))
    return null;
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
      {settings.adsProvider === "placeholder" ? (
        <div className="ad-slot__inner border border-dashed flex items-center justify-center text-muted">
          {size.label}
        </div>
      ) : (
        <>
          <Script
            id="adsense"
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${settings.adsenseId}`}
            crossOrigin="anonymous"
          />
          <ins
            ref={ref}
            className="adsbygoogle block w-full"
            data-ad-client={settings.adsenseId}
            data-ad-slot={slot}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </>
      )}
    </aside>
  );
}

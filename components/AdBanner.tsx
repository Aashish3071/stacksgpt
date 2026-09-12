"use client";

import React, { useEffect, useRef } from "react";

export default function AdBanner({
  bannerId,
  className = "",
}: {
  bannerId: string | number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const numericId = Number(bannerId);

  useEffect(() => {
    try {
      if (ref.current && ref.current.children.length > 0) {
        return;
      }

      const win = window as any;
      if (typeof win.AdManager?.runFormatSpot === "function") {
        win.AdManager.runFormatSpot("banner", { spot_id: numericId });
      } else if (typeof win.a3klsam?.runFormatSpot === "function") {
        win.a3klsam.runFormatSpot("banner", { spot_id: numericId });
      }
    } catch {}
  }, [numericId]);

  return (
    <aside
      aria-label="Advertisement"
      className={`my-8 flex flex-col items-center justify-center overflow-hidden text-center ${className}`}
    >
      <p className="mb-2 text-center font-sans text-[11px] font-medium uppercase tracking-wider text-muted">
        Advertisement
      </p>
      <div
        ref={ref}
        data-banner-id={String(bannerId)}
        data-clickadilla-banner={String(bannerId)}
        className="min-h-[90px] min-w-[300px] max-w-full flex items-center justify-center overflow-hidden"
      />
    </aside>
  );
}

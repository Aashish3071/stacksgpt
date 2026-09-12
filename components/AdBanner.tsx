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

  useEffect(() => {
    try {
      const win = window as any;
      if (typeof win.mbidadm?.refresh === "function") {
        win.mbidadm.refresh();
      } else if (typeof win.mbidadm?.init === "function") {
        win.mbidadm.init();
      }
    } catch {}
  }, [bannerId]);

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
        className="min-h-[90px] min-w-[300px] max-w-full flex items-center justify-center overflow-hidden"
      />
    </aside>
  );
}

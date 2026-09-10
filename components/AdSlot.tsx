import Script from "next/script";
import {
  AD_SIZES,
  AdPlacement,
  adsEnabled,
  adsProvider,
  adsensePublisherId,
} from "@/lib/ad-config";

/**
 * A single ad position.
 *
 * Three states:
 *   1. No provider configured (default)  → renders nothing at all, so the page has
 *      no blank gaps while you are still building an archive and applying.
 *   2. Provider configured, development  → a labelled outline, so placements are
 *      visible while designing without loading a network.
 *   3. Provider configured, production   → a container that reserves the exact ad
 *      size before the network paints, giving zero layout shift.
 */
export default function AdSlot({
  placement,
  className = "",
}: {
  placement: AdPlacement;
  className?: string;
}) {
  if (!adsEnabled()) return null;

  const size = AD_SIZES[placement];
  const provider = adsProvider();
  const isDev = process.env.NODE_ENV !== "production";

  // Reserve the space at both breakpoints via CSS custom properties.
  const style = {
    "--ad-h-mobile": `${size.mobile.height}px`,
    "--ad-h-desktop": `${size.desktop.height}px`,
  } as React.CSSProperties;

  return (
    <div
      className={`ad-slot my-8 flex justify-center ${className}`}
      style={style}
      data-placement={placement}
    >
      <div className="ad-slot__inner flex w-full items-center justify-center">
        {isDev ? (
          <span className="border border-dashed border-rule-strong px-3 py-1 font-sans text-kicker uppercase tracking-wider text-faint">
            {size.label} · {size.desktop.width}×{size.desktop.height}
          </span>
        ) : provider === "adsense" && adsensePublisherId() ? (
          <>
            <Script
              id="adsbygoogle-init"
              async
              strategy="afterInteractive"
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsensePublisherId()}`}
              crossOrigin="anonymous"
            />
            <ins
              className="adsbygoogle block w-full"
              data-ad-client={adsensePublisherId()}
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
            <Script id={`ad-${placement}`} strategy="afterInteractive">
              {`(adsbygoogle = window.adsbygoogle || []).push({});`}
            </Script>
          </>
        ) : null}
      </div>
    </div>
  );
}

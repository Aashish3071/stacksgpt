/**
 * Every ad placement on the site, in one place.
 *
 * Dimensions are declared here so the container can reserve exactly the space an
 * ad will occupy. That is what keeps Cumulative Layout Shift near zero when ads
 * are switched on later — a page that reflows as ads load is penalised by Core
 * Web Vitals and is the most common self-inflicted ranking wound on ad-funded sites.
 */

export type AdPlacement =
  | "home-leaderboard"
  | "home-in-feed"
  | "home-rail"
  | "article-after-summary"
  | "article-mid-body"
  | "article-end";

export interface AdSize {
  /** Reserved height in px at each breakpoint. */
  mobile: { width: number; height: number };
  desktop: { width: number; height: number };
  label: string;
}

/**
 * The three ad unit shapes created in AdSense, and the markup each needs.
 *
 * These are not interchangeable: an in-article unit needs
 * data-ad-layout="in-article", an in-feed unit needs the layout key generated
 * with it, and only the display unit takes full-width-responsive. Rendering
 * the wrong attributes gives an ad that either never fills or fills badly.
 *
 * Slot IDs are public — they ship in the page source of every site running
 * AdSense — so keeping them here rather than in the database means a
 * placement works on deploy instead of waiting on someone pasting IDs into
 * the settings screen. A value in SiteSetting.adUnits still overrides.
 */
export type AdFormat = "display" | "in-feed" | "in-article";

export interface AdUnit {
  format: AdFormat;
  slot: string;
  /** Only in-feed units carry a layout key, generated alongside the unit. */
  layoutKey?: string;
}

export const AD_UNITS: Record<AdFormat, AdUnit> = {
  display: { format: "display", slot: "9783016430" },
  "in-feed": {
    format: "in-feed",
    slot: "3656591787",
    layoutKey: "-71+cz-1y-c+hp",
  },
  "in-article": { format: "in-article", slot: "4641149208" },
};

/** Which unit shape each placement on the site should render. */
export const PLACEMENT_FORMAT: Record<AdPlacement, AdFormat> = {
  "home-leaderboard": "display",
  "home-in-feed": "in-feed",
  "home-rail": "display",
  "article-after-summary": "in-article",
  "article-mid-body": "in-article",
  "article-end": "display",
};

export const AD_SIZES: Record<AdPlacement, AdSize> = {
  "home-leaderboard": {
    mobile: { width: 320, height: 100 },
    desktop: { width: 728, height: 90 },
    label: "Leaderboard",
  },
  "home-in-feed": {
    mobile: { width: 300, height: 250 },
    desktop: { width: 728, height: 90 },
    label: "In-feed",
  },
  "home-rail": {
    mobile: { width: 300, height: 250 },
    desktop: { width: 300, height: 600 },
    label: "Rail",
  },
  "article-after-summary": {
    mobile: { width: 300, height: 250 },
    desktop: { width: 580, height: 250 },
    label: "In-article",
  },
  "article-mid-body": {
    mobile: { width: 300, height: 250 },
    desktop: { width: 580, height: 250 },
    label: "In-article",
  },
  "article-end": {
    mobile: { width: 300, height: 250 },
    desktop: { width: 580, height: 250 },
    label: "End of article",
  },
};

/**
 * Which network is live. Empty means no ad markup renders at all — the state the
 * site stays in until an application is approved.
 */
export function adsProvider(): string {
  return (process.env.NEXT_PUBLIC_ADS_PROVIDER || "").trim().toLowerCase();
}

export function adsEnabled(): boolean {
  return adsProvider().length > 0;
}

export function adsensePublisherId(): string {
  return (process.env.NEXT_PUBLIC_ADSENSE_ID || "").trim();
}

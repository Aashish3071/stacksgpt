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

import { perRequest } from "./per-request-cache";
import prisma from "./db";
export const defaultSettings = {
  name: "StacksGPT",
  tagline: "Simplifying the AI for you",
  contactEmail: "support@stacksgpt.com",
  socialLinks: [
    { label: "X", url: "https://x.com/StacksGPT01" },
    { label: "LinkedIn", url: "https://www.linkedin.com/company/stacksgpt/" },
  ] as {
    label: string;
    url: string;
  }[],
  // AdSense is approved and the units exist, so placements render by default.
  // Consent still gates them: PrivacyControls keeps `ads` false until the
  // reader accepts, so nothing loads for someone who declined.
  adsEnabled: true,
  adsProvider: "adsense",
  adsenseId: "ca-pub-4670311397990890",
  adUnits: {} as Record<string, string>,
  analyticsEnabled: false,
  ga4Id: "",
  searchConsoleId: "",
  rssFallbackEnabled: true,
};
// Deduped per request: the root layout alone calls this twice (once in
// generateMetadata, once in the layout body), and several routes call it
// again on top of that. Without cache() each call is a separate round trip.
export const getSettings = perRequest(async function getSettings() {
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { key: "publication" },
    });
    return { ...defaultSettings, ...((row?.value as any) || {}) };
  } catch (err) {
    console.warn("Could not fetch publication settings, using defaults:", err);
    return defaultSettings;
  }
});

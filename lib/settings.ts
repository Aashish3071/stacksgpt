import prisma from "./db";
export const defaultSettings = {
  name: "Stacksgpt",
  tagline:
    "We track the latest AI and tech developments so you do not have to, delivering what is new and why it matters.",
  contactEmail: "support@stacksgpt.com",
  socialLinks: [] as { label: string; url: string }[],
  adsEnabled: false,
  adsProvider: "disabled",
  adsenseId: "",
  adUnits: {} as Record<string, string>,
  analyticsEnabled: false,
  ga4Id: "",
  searchConsoleId: "",
  rssFallbackEnabled: true,
};
export async function getSettings() {
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { key: "publication" },
    });
    return { ...defaultSettings, ...((row?.value as any) || {}) };
  } catch (err) {
    console.warn("Could not fetch publication settings, using defaults:", err);
    return defaultSettings;
  }
}

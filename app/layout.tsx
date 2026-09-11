import type { Metadata } from "next";
import { Source_Serif_4, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PrivacyControls from "@/components/PrivacyControls";
import SiteChrome from "@/components/SiteChrome";
import { getSettings } from "@/lib/settings";
import prisma from "@/lib/db";

import { SITE_NAME, SITE_TAGLINE, siteUrl, CATEGORIES } from "@/lib/site";
import GoogleTagManager from "@/components/GoogleTagManager";
import VercelAnalytics from "@/components/VercelAnalytics";

const serif = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
  style: ["normal", "italic"],
});

const sans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const baseMetadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Simplifying the AI for you",
    template: `%s · ${SITE_NAME}`,
  },
  description:
    "We track the latest AI and tech developments so you do not have to, delivering what is new and why it matters.",
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
  },
  icons: {
    icon: "/images/logos/logo.jpg",
    shortcut: "/images/logos/logo.jpg",
    apple: "/images/logos/logo.jpg",
  },
  robots: { index: true, follow: true },
};

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    ...baseMetadata,
    title: {
      default: "Simplifying the AI for you",
      template: `%s · ${s.name || SITE_NAME}`,
    },
    verification: s.searchConsoleId ? { google: s.searchConsoleId } : undefined,
  };
}
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || "GTM-T9X6VDM7";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await getSettings();
  let categories: { name: string; slug: string }[] = [];
  try {
    categories = await prisma.taxonomy.findMany({
      where: { kind: "CATEGORY", active: true },
      orderBy: { name: "asc" },
      select: { name: true, slug: true },
    });
  } catch (err) {
    console.warn("Could not fetch categories taxonomy, using defaults:", err);
  }
  if (!categories.length) {
    categories = CATEGORIES.map((c) => ({ name: c, slug: c.toLowerCase() }));
  }
  const publicSettings = {
    name: s.name,
    tagline: s.tagline,
    analyticsEnabled: s.analyticsEnabled,
    ga4Id: s.ga4Id,
    adsEnabled: s.adsEnabled,
    adsProvider: s.adsProvider,
    adsenseId: s.adsenseId,
    adUnits: s.adUnits,
  };
  return (
    <html
      lang="en"
      className={`${serif.variable} ${sans.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col" suppressHydrationWarning>
        <GoogleTagManager gtmId={GTM_ID} />
        <PrivacyControls settings={publicSettings}>
          <SiteChrome
            navbar={<Navbar categories={categories} />}
            footer={<Footer socialLinks={s.socialLinks} />}
          >
            {children}
          </SiteChrome>
        </PrivacyControls>
        <VercelAnalytics />
      </body>
    </html>
  );
}

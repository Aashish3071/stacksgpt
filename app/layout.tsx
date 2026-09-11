import type { Metadata } from "next";
import Script from "next/script";
import { Source_Serif_4, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PrivacyControls from "@/components/PrivacyControls";
import { getSettings } from "@/lib/settings";
import prisma from "@/lib/db";

import { SITE_NAME, SITE_TAGLINE, siteUrl } from "@/lib/site";

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
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s — ${SITE_NAME}`,
  },
  description:
    "Stack the facts. Skip the hype. We report what's new in AI and what actually matters in plain English.",
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
    title: { default: `${s.name} — ${s.tagline}`, template: `%s — ${s.name}` },
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
  const categories = await prisma.taxonomy.findMany({
    where: { kind: "CATEGORY", active: true },
    orderBy: { name: "asc" },
    select: { name: true, slug: true },
  });
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
      <head>
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
      </head>
      <body className="flex min-h-screen flex-col" suppressHydrationWarning>
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <PrivacyControls settings={publicSettings}>
          <Navbar categories={categories} />
          <main className="flex-1">{children}</main>
          <Footer tagline={s.tagline} socialLinks={s.socialLinks} />
        </PrivacyControls>
      </body>
    </html>
  );
}

"use client";
import Link from "next/link";
import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
export type PublicSettings = {
  name: string;
  tagline: string;
  analyticsEnabled: boolean;
  ga4Id: string;
  adsEnabled: boolean;
  adsProvider: string;
  adsenseId: string;
  adUnits: Record<string, string>;
};
const Context = createContext<{
  analytics: boolean;
  ads: boolean;
  settings: PublicSettings;
}>({ analytics: false, ads: false, settings: {} as PublicSettings });
export const usePrivacy = () => useContext(Context);
export function track(event: string, slug?: string) {
  void fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, slug }),
    keepalive: true,
  }).catch(() => {});
}
export default function PrivacyControls({
  settings,
  children,
}: {
  settings: PublicSettings;
  children: React.ReactNode;
}) {
  const [consent, setConsent] = useState<{
    analytics: boolean;
    ads: boolean;
  } | null>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const privatePage =
    pathname.startsWith("/admin") || pathname.startsWith("/newsletter/");
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("stacksgpt-privacy") || "null",
      );
      if (
        saved &&
        typeof saved.analytics === "boolean" &&
        typeof saved.ads === "boolean"
      )
        setConsent(saved);
      else setOpen(settings.analyticsEnabled || settings.adsEnabled);
    } catch {
      setOpen(settings.analyticsEnabled || settings.adsEnabled);
    }
  }, [settings.adsEnabled, settings.analyticsEnabled]);
  function choose(analytics: boolean, ads: boolean) {
    const reload = !!(
      (consent?.analytics && !analytics) ||
      (consent?.ads && !ads)
    );
    const value = { analytics, ads };
    setConsent(value);
    setOpen(false);
    try {
      localStorage.setItem("stacksgpt-privacy", JSON.stringify(value));
    } catch {}
    document.cookie = `stacksgpt_consent=${analytics ? "yes" : "no"};path=/;max-age=15552000;samesite=lax${location.protocol === "https:" ? ";secure" : ""}`;
    if (!analytics) {
      for (const cookie of document.cookie.split(";")) {
        const name = cookie.split("=")[0].trim();
        if (name.startsWith("_ga"))
          document.cookie = `${name}=;max-age=0;path=/`;
      }
    }
    if (reload) location.reload();
  }
  const analytics =
    !!consent?.analytics && settings.analyticsEnabled && !privatePage;
  const ads = !!consent?.ads && settings.adsEnabled && !privatePage;
  useEffect(() => {
    if (analytics && pathname === "/search") track("search");
  }, [analytics, pathname]);
  return (
    <Context.Provider value={{ analytics, ads, settings }}>
      {children}
      {analytics && (
        <>
          {settings.ga4Id && (
            <>
              <Script
                id="ga-loader"
                src={`https://www.googletagmanager.com/gtag/js?id=${settings.ga4Id}`}
              />
              <Script id="ga-config">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config',${JSON.stringify(settings.ga4Id)},{send_page_view:false});`}</Script>
            </>
          )}
        </>
      )}
      {!privatePage && (
        <div className="flex justify-center pb-6">
          <button
            className="text-xs text-muted hover:text-ink underline py-2.5 px-4 min-h-[44px] inline-flex items-center justify-center transition-colors"
            onClick={() => setOpen(true)}
          >
            Privacy choices
          </button>
        </div>
      )}
      {open &&
        !privatePage && (
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Privacy choices"
            className="fixed bottom-0 inset-x-0 z-[70] bg-paper border-t border-ink p-5 shadow-xl"
          >
            <div className="max-w-shell mx-auto">
              <h2 className="font-serif text-2xl">Your privacy choices</h2>
              <p className="my-3 max-w-3xl">
                Optional analytics help us understand which stories are useful.
                Advertising may use cookies. Both stay off until you choose.{" "}
                <Link href="/privacy" className="underline">
                  Read our privacy policy.
                </Link>
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  className="border border-rule px-4 py-2.5 min-h-[44px] font-sans text-xs font-medium hover:border-ink transition-colors"
                  onClick={() => choose(false, false)}
                >
                  Reject optional
                </button>
                <button
                  className="border border-rule px-4 py-2.5 min-h-[44px] font-sans text-xs font-medium hover:border-ink transition-colors"
                  onClick={() => choose(true, false)}
                >
                  Allow analytics only
                </button>
                <button
                  className="border border-rule px-4 py-2.5 min-h-[44px] font-sans text-xs font-medium hover:border-ink transition-colors"
                  onClick={() => choose(false, true)}
                >
                  Allow ads only
                </button>
                <button
                  className="bg-ink text-paper px-4 py-2.5 min-h-[44px] font-sans text-xs font-medium hover:bg-ink/90 transition-colors"
                  onClick={() => choose(true, true)}
                >
                  Allow both
                </button>
              </div>
            </div>
          </section>
        )}
    </Context.Provider>
  );
}

"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

export default function GoogleTagManager({ gtmId }: { gtmId: string }) {
  const pathname = usePathname();
  const isPrivate =
    pathname?.startsWith("/admin") || pathname?.startsWith("/newsletter/");

  // Never load GTM or Google Analytics on admin or private routes
  if (isPrivate || !gtmId) {
    return null;
  }

  return (
    <>
      <Script id="google-tag-manager" strategy="lazyOnload">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtag/js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`}
      </Script>
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>
    </>
  );
}

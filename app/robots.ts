import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Nothing here should ever be indexed or crawled.
        disallow: ["/admin", "/api/", "/newsletter/"],
      },
    ],
    sitemap: siteUrl("/sitemap.xml"),
  };
}

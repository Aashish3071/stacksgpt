import { jsonLd } from "@/lib/safe-markdown";
import { SITE_NAME, siteUrl, isoDate, categoryHref } from "@/lib/site";

export default function ArticleSchema({
  title,
  summary,
  slug,
  publishedAt,
  updatedAt,
  image,
  authorName,
  category,
  keywords,
}: {
  title: string;
  summary: string;
  slug: string;
  publishedAt: Date | string | null;
  updatedAt: Date | string | null;
  image?: string | null;
  authorName?: string;
  category: string;
  keywords?: string[];
}) {
  const url = siteUrl(`/article/${slug}`);
  const fullImageUrl = image
    ? image.startsWith("https://")
      ? image
      : siteUrl(image)
    : siteUrl("/images/logos/logo.jpg");

  const graph: any[] = [
    {
      "@type": "NewsArticle",
      "@id": `${url}#article`,
      isPartOf: {
        "@type": "WebSite",
        "@id": `${siteUrl()}#website`,
        name: SITE_NAME,
        url: siteUrl(),
      },
      headline: title,
      description: summary,
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": url,
      },
      url,
      inLanguage: "en-US",
      datePublished: isoDate(publishedAt),
      dateModified: isoDate(updatedAt || publishedAt),
      keywords: keywords && keywords.length ? keywords.join(", ") : undefined,
      image: {
        "@type": "ImageObject",
        url: fullImageUrl,
        width: 1200,
        height: 670,
      },
      author: authorName
        ? {
            "@type": "Person",
            name: authorName,
          }
        : {
            "@type": "Organization",
            name: SITE_NAME,
            url: siteUrl(),
          },
      publisher: {
        "@type": "Organization",
        name: SITE_NAME,
        url: siteUrl(),
        logo: {
          "@type": "ImageObject",
          url: siteUrl("/images/logos/logo.jpg"),
          width: 512,
          height: 512,
        },
      },
      articleSection: category,
      isAccessibleForFree: true,
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["h1", "header p"],
      },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: siteUrl(),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: category,
          item: siteUrl(categoryHref(category)),
        },
        {
          "@type": "ListItem",
          position: 3,
          name: title,
          item: url,
        },
      ],
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: jsonLd({ "@context": "https://schema.org", "@graph": graph }),
      }}
    />
  );
}

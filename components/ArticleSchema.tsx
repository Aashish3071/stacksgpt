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
}: {
  title: string;
  summary: string;
  slug: string;
  publishedAt: Date | string | null;
  updatedAt: Date | string | null;
  image?: string | null;
  authorName?: string;
  category: string;
}) {
  const url = siteUrl(`/article/${slug}`);
  const graph = [
    {
      "@type": "NewsArticle",
      headline: title,
      description: summary,
      mainEntityOfPage: url,
      url,
      datePublished: isoDate(publishedAt),
      dateModified: isoDate(updatedAt),
      ...(image
        ? { image: image.startsWith("https://") ? image : siteUrl(image) }
        : {}),
      author: authorName
        ? { "@type": "Person", name: authorName }
        : { "@type": "Organization", name: SITE_NAME, url: siteUrl() },
      publisher: { "@type": "Organization", name: SITE_NAME, url: siteUrl() },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl() },
        {
          "@type": "ListItem",
          position: 2,
          name: category,
          item: siteUrl(categoryHref(category)),
        },
        { "@type": "ListItem", position: 3, name: title, item: url },
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

import { jsonLd } from "@/lib/safe-markdown";
import { SITE_NAME, siteUrl } from "@/lib/site";

export interface CollectionItem {
  title: string;
  slug: string;
  publishedAt?: Date | string | null;
  summary?: string;
  image?: string | null;
}

export default function CollectionSchema({
  name,
  description,
  url,
  breadcrumbs,
  items = [],
}: {
  name: string;
  description: string;
  url: string;
  breadcrumbs: { name: string; url: string }[];
  items?: CollectionItem[];
}) {
  const graph: any[] = [
    {
      "@type": "CollectionPage",
      "@id": `${url}#webpage`,
      url,
      name,
      description,
      isPartOf: {
        "@type": "WebSite",
        "@id": `${siteUrl()}#website`,
        name: SITE_NAME,
        url: siteUrl(),
      },
      inLanguage: "en-US",
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: breadcrumbs.map((bc, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        name: bc.name,
        item: bc.url,
      })),
    },
  ];

  if (items.length > 0) {
    graph.push({
      "@type": "ItemList",
      "@id": `${url}#itemlist`,
      name,
      numberOfItems: items.length,
      itemListElement: items.map((item, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        name: item.title,
        url: siteUrl(`/article/${item.slug}`),
      })),
    });
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: jsonLd({ "@context": "https://schema.org", "@graph": graph }),
      }}
    />
  );
}

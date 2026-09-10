import { SITE_NAME, isoDate, siteUrl } from "@/lib/site";

interface UseCase {
  title: string;
  stepByStep: string[];
}

/**
 * Article + FAQ structured data.
 *
 * The three use cases map naturally onto FAQPage entries, which is what makes
 * these pages eligible for expanded search results — the cheapest traffic gain
 * available to a site like this.
 */
export default function ArticleSchema({
  title,
  summary,
  slug,
  publishedAt,
  useCases,
}: {
  title: string;
  summary: string;
  slug: string;
  publishedAt: Date | string | null;
  useCases: UseCase[];
}) {
  const url = siteUrl(`/article/${slug}`);
  const published = isoDate(publishedAt);

  const graph: Record<string, unknown>[] = [
    {
      "@type": "NewsArticle",
      headline: title.slice(0, 110),
      description: summary,
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      url,
      ...(published ? { datePublished: published, dateModified: published } : {}),
      publisher: { "@type": "Organization", name: SITE_NAME, url: siteUrl() },
      author: { "@type": "Organization", name: SITE_NAME, url: siteUrl() },
    },
  ];

  const faqs = useCases.filter((u) => u.title && u.stepByStep?.length);
  if (faqs.length > 0) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: faqs.map((u) => ({
        "@type": "Question",
        name: u.title,
        acceptedAnswer: { "@type": "Answer", text: u.stepByStep.join(" ") },
      })),
    });
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }),
      }}
    />
  );
}

import Link from "next/link";

export interface ToolCardData {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  category: string;
  pricingModel: string;
  websiteUrl: string;
  affiliateUrl?: string | null;
  status?: string | null;
}

export default function AffiliateToolCard({ tool }: { tool: ToolCardData }) {
  // Only a hand-entered, approved partner link is treated as one.
  const isPartnerLink = Boolean(tool.affiliateUrl && tool.status === "ACTIVE");

  return (
    <article className="flex flex-col py-5">
      <span className="kicker-muted">{tool.category}</span>

      <h3 className="mt-1.5 font-serif text-head-sm font-semibold text-ink">{tool.name}</h3>

      <p className="mt-1.5 font-sans text-meta leading-relaxed text-muted">{tool.tagline}</p>

      <p className="meta mt-2">{tool.pricingModel}</p>

      <p className="mt-3">
        {isPartnerLink ? (
          <>
            <Link
              href={`/api/affiliate/${tool.slug}`}
              target="_blank"
              rel="sponsored nofollow noopener"
              className="font-sans text-meta font-medium text-accent underline decoration-rule-strong hover:decoration-accent"
            >
              Visit site
            </Link>
            <span className="meta"> · partner link</span>
          </>
        ) : (
          <a
            href={tool.websiteUrl}
            target="_blank"
            rel="nofollow noreferrer"
            className="font-sans text-meta font-medium text-accent underline decoration-rule-strong hover:decoration-accent"
          >
            Visit site
          </a>
        )}
      </p>
    </article>
  );
}

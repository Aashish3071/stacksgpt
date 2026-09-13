import Link from "next/link";

export interface ToolCardData {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description?: string | null;
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
    <article className="flex flex-col justify-between rounded-lg border border-rule bg-surface p-5 transition-all hover:border-ink/40 hover:shadow-sm">
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-accent">
            {tool.category}
          </span>
          <span className="rounded bg-paper px-2 py-0.5 font-sans text-[11px] font-medium text-ink/70 border border-rule/70">
            {tool.pricingModel}
          </span>
        </div>

        <h3 className="mt-2.5 font-serif text-lg font-semibold text-ink">
          {tool.name}
        </h3>

        <p className="mt-1.5 font-sans text-xs font-medium leading-snug text-ink/80">
          {tool.tagline}
        </p>

        {tool.description && (
          <p className="mt-2 font-sans text-xs leading-relaxed text-muted">
            {tool.description}
          </p>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-rule/60 flex items-center justify-between">
        {isPartnerLink ? (
          <div className="flex items-center gap-1.5">
            <Link
              href={`/api/affiliate/${tool.slug}`}
              target="_blank"
              rel="sponsored nofollow noopener"
              className="inline-flex items-center gap-1 font-sans text-xs font-semibold text-accent hover:underline min-h-[36px]"
            >
              <span>Visit official site</span>
              <span>↗</span>
            </Link>
            <span className="meta"> · partner link</span>
          </div>
        ) : (
          <a
            href={tool.websiteUrl}
            target="_blank"
            rel="nofollow noreferrer"
            className="inline-flex items-center gap-1 font-sans text-xs font-semibold text-accent hover:underline min-h-[36px]"
          >
            <span>Visit official site</span>
            <span>↗</span>
          </a>
        )}
      </div>
    </article>
  );
}

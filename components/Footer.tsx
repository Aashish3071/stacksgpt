"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE_NAME } from "@/lib/site";
import Logo from "@/components/Logo";
import { usePrivacy } from "@/components/PrivacyControls";

export default function Footer({
  tagline: _tagline,
  socialLinks = [],
}: {
  tagline?: string;
  socialLinks?: { label: string; url: string }[];
}) {
  const pathname = usePathname();
  const { openPrivacyChoices } = usePrivacy();

  // Suppress public footer on all administrative routes
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const twitterLink =
    socialLinks.find(
      (l) =>
        l.label.toLowerCase().includes("twitter") ||
        l.label.toLowerCase().includes("x") ||
        l.url.includes("x.com") ||
        l.url.includes("twitter.com"),
    )?.url || "https://x.com/StacksGPT01";

  const linkedinLink =
    socialLinks.find(
      (l) =>
        l.label.toLowerCase().includes("linkedin") ||
        l.url.includes("linkedin.com"),
    )?.url || "https://www.linkedin.com/company/stacksgpt/";

  return (
    <footer className="border-t border-rule bg-surface m-0 p-0">
      <div className="mx-auto max-w-shell px-4 pt-12 pb-6 sm:px-6">
        {/* Main 4-column layout */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Column 1: Brand, Tagline, Twitter (spans 2 cols on lg) */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block">
              <Logo size="md" />
            </Link>
            <p className="meta mt-3 max-w-md text-sm leading-relaxed text-muted">
              Production AI workflows, automation templates, and engineering services. Plus reported artificial intelligence news and frontier model intelligence.
            </p>

            <div className="mt-5 flex flex-col gap-2 font-sans text-xs">
              <span className="text-muted">
                Engineering &amp; inquiries:{" "}
                <a
                  href="mailto:support@stacksgpt.com"
                  className="text-ink hover:underline font-medium py-1 inline-block"
                >
                  support@stacksgpt.com
                </a>
              </span>
            </div>

            {/* Social follow buttons */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <a
                href={twitterLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow StacksGPT on X"
                className="inline-flex items-center gap-2 rounded-lg border border-rule bg-paper px-3.5 py-2.5 font-sans text-xs font-medium text-ink transition-colors hover:border-ink hover:bg-surface min-h-[44px]"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="shrink-0"
                  aria-hidden="true"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>Follow on X</span>
              </a>

              <a
                href={linkedinLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow StacksGPT on LinkedIn"
                className="inline-flex items-center gap-2 rounded-lg border border-rule bg-paper px-3.5 py-2.5 font-sans text-xs font-medium text-ink transition-colors hover:border-ink hover:bg-surface min-h-[44px]"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="shrink-0"
                  aria-hidden="true"
                >
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                </svg>
                <span>Follow on LinkedIn</span>
              </a>
            </div>
          </div>

          {/* Column 2: Blueprints & Automations */}
          <div>
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-ink">
              Workflows &amp; Services
            </h3>
            <ul className="mt-3 space-y-1 font-sans text-sm">
              <li>
                <Link
                  href="/blueprints"
                  prefetch={true}
                  className="flex items-center py-2 text-muted hover:text-ink transition-colors min-h-[44px]"
                >
                  All Blueprints
                </Link>
              </li>
              <li>
                <Link
                  href="/blueprints?category=automation"
                  prefetch={true}
                  className="flex items-center py-2 text-muted hover:text-ink transition-colors min-h-[44px]"
                >
                  Automations
                </Link>
              </li>
              <li>
                <Link
                  href="/blueprints?category=ai-agents"
                  prefetch={true}
                  className="flex items-center py-2 text-muted hover:text-ink transition-colors min-h-[44px]"
                >
                  AI Agents
                </Link>
              </li>
              <li>
                <Link
                  href="/blueprints?category=marketing"
                  prefetch={true}
                  className="flex items-center py-2 text-muted hover:text-ink transition-colors min-h-[44px]"
                >
                  Marketing Workflows
                </Link>
              </li>
              <li>
                <Link
                  href="/blueprints?category=sales"
                  prefetch={true}
                  className="flex items-center py-2 text-muted hover:text-ink transition-colors min-h-[44px]"
                >
                  Sales &amp; GTM Pipelines
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: AI News Categories */}
          <div>
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-ink">
              AI News Categories
            </h3>
            <ul className="mt-3 space-y-1 font-sans text-sm">
              <li>
                <Link
                  href="/category/productivity"
                  prefetch={true}
                  className="flex items-center py-2 text-muted hover:text-ink transition-colors min-h-[44px]"
                >
                  Productivity
                </Link>
              </li>
              <li>
                <Link
                  href="/category/writing"
                  prefetch={true}
                  className="flex items-center py-2 text-muted hover:text-ink transition-colors min-h-[44px]"
                >
                  Writing
                </Link>
              </li>
              <li>
                <Link
                  href="/category/coding"
                  prefetch={true}
                  className="flex items-center py-2 text-muted hover:text-ink transition-colors min-h-[44px]"
                >
                  Coding
                </Link>
              </li>
              <li>
                <Link
                  href="/category/research"
                  prefetch={true}
                  className="flex items-center py-2 text-muted hover:text-ink transition-colors min-h-[44px]"
                >
                  Research
                </Link>
              </li>
              <li>
                <Link
                  href="/category/design"
                  prefetch={true}
                  className="flex items-center py-2 text-muted hover:text-ink transition-colors min-h-[44px]"
                >
                  Design
                </Link>
              </li>
              <li>
                <Link
                  href="/category/automation"
                  prefetch={true}
                  className="flex items-center py-2 text-muted hover:text-ink transition-colors min-h-[44px]"
                >
                  Automation
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Publication & Standards */}
          <div>
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-ink">
              Publication
            </h3>
            <ul className="mt-3 space-y-1 font-sans text-sm">
              <li>
                <Link
                  href="/about"
                  prefetch={true}
                  className="flex items-center py-2 text-muted hover:text-ink transition-colors min-h-[44px]"
                >
                  About StacksGPT
                </Link>
              </li>
              <li>
                <Link
                  href="/editorial-standards"
                  prefetch={true}
                  className="flex items-center py-2 text-muted hover:text-ink transition-colors min-h-[44px]"
                >
                  Editorial Standards
                </Link>
              </li>
              <li>
                <Link
                  href="/methodology"
                  prefetch={true}
                  className="flex items-center py-2 text-muted hover:text-ink transition-colors min-h-[44px]"
                >
                  How We Report
                </Link>
              </li>
              <li>
                <Link
                  href="/corrections"
                  prefetch={true}
                  className="flex items-center py-2 text-muted hover:text-ink transition-colors min-h-[44px]"
                >
                  Corrections Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  prefetch={true}
                  className="flex items-center py-2 text-muted hover:text-ink transition-colors min-h-[44px]"
                >
                  Contact Engineering
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Sub-footer: Copyright & Legal */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-rule pt-5 pb-2 font-sans text-xs text-muted sm:flex-row">
          <p suppressHydrationWarning>
            © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/privacy" className="py-2 inline-flex items-center hover:text-ink transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="py-2 inline-flex items-center hover:text-ink transition-colors">
              Terms of Service
            </Link>
            <Link href="/partners" className="py-2 inline-flex items-center hover:text-ink transition-colors">
              Partner Disclosures
            </Link>
            <button
              type="button"
              onClick={openPrivacyChoices}
              className="py-2 inline-flex items-center text-muted hover:text-ink transition-colors"
            >
              Privacy choices
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

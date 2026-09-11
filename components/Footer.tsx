"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE_NAME } from "@/lib/site";
import Logo from "@/components/Logo";

export default function Footer({
  tagline,
  socialLinks = [],
}: {
  tagline?: string;
  socialLinks?: { label: string; url: string }[];
}) {
  const pathname = usePathname();

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

  return (
    <footer className="mt-20 border-t border-rule bg-surface">
      <div className="mx-auto max-w-shell px-4 py-12 sm:px-6">
        {/* Main 4-column layout */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Column 1: Brand, Tagline, Twitter (spans 2 cols on lg) */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block">
              <Logo size="md" />
            </Link>
            <p className="meta mt-3 max-w-md text-sm leading-relaxed text-muted">
              {tagline ||
                "We track the latest AI and tech developments so you do not have to, delivering what is new and why it matters."}
            </p>

            <div className="mt-5 flex flex-col gap-2 font-sans text-xs">
              <span className="text-muted">
                Editorial & support:{" "}
                <a
                  href="mailto:support@stacksgpt.com"
                  className="text-ink hover:underline font-medium"
                >
                  support@stacksgpt.com
                </a>
              </span>
            </div>

            {/* Twitter / X follow button */}
            <div className="mt-5">
              <a
                href={twitterLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-rule bg-paper px-3.5 py-1.5 font-sans text-xs font-medium text-ink transition-colors hover:border-ink hover:bg-surface"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="shrink-0"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>Follow @StacksGPT01 on X</span>
              </a>
            </div>
          </div>

          {/* Column 2: News & Briefings (matching Navbar) */}
          <div>
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-ink">
              News & Briefings
            </h3>
            <ul className="mt-4 space-y-2.5 font-sans text-sm">
              <li>
                <Link
                  href="/latest"
                  prefetch={true}
                  className="text-muted hover:text-ink transition-colors"
                >
                  Latest Stories
                </Link>
              </li>
              <li>
                <Link
                  href="/category/research"
                  prefetch={true}
                  className="text-muted hover:text-ink transition-colors"
                >
                  Research & Models
                </Link>
              </li>
              <li>
                <Link
                  href="/tools"
                  prefetch={true}
                  className="text-muted hover:text-ink transition-colors"
                >
                  AI Tools Directory
                </Link>
              </li>
              <li>
                <Link
                  href="/search"
                  prefetch={true}
                  className="text-muted hover:text-ink transition-colors"
                >
                  Search Stories
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Categories (matching Navbar Category dropdown) */}
          <div>
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-ink">
              Categories
            </h3>
            <ul className="mt-4 space-y-2.5 font-sans text-sm">
              <li>
                <Link
                  href="/category/productivity"
                  prefetch={true}
                  className="text-muted hover:text-ink transition-colors"
                >
                  Productivity
                </Link>
              </li>
              <li>
                <Link
                  href="/category/coding"
                  prefetch={true}
                  className="text-muted hover:text-ink transition-colors"
                >
                  Coding
                </Link>
              </li>
              <li>
                <Link
                  href="/category/design"
                  prefetch={true}
                  className="text-muted hover:text-ink transition-colors"
                >
                  Design
                </Link>
              </li>
              <li>
                <Link
                  href="/category/automation"
                  prefetch={true}
                  className="text-muted hover:text-ink transition-colors"
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
            <ul className="mt-4 space-y-2.5 font-sans text-sm">
              <li>
                <Link
                  href="/about"
                  prefetch={true}
                  className="text-muted hover:text-ink transition-colors"
                >
                  About StacksGPT
                </Link>
              </li>
              <li>
                <Link
                  href="/editorial-standards"
                  prefetch={true}
                  className="text-muted hover:text-ink transition-colors"
                >
                  Editorial Standards
                </Link>
              </li>
              <li>
                <Link
                  href="/methodology"
                  prefetch={true}
                  className="text-muted hover:text-ink transition-colors"
                >
                  How We Report
                </Link>
              </li>
              <li>
                <Link
                  href="/corrections"
                  prefetch={true}
                  className="text-muted hover:text-ink transition-colors"
                >
                  Corrections Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  prefetch={true}
                  className="text-muted hover:text-ink transition-colors"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Sub-footer: Copyright & Legal */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-rule pt-6 font-sans text-xs text-muted sm:flex-row">
          <p suppressHydrationWarning>
            © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-6">
            <Link href="/privacy" className="hover:text-ink transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-ink transition-colors">
              Terms of Service
            </Link>
            <Link href="/partners" className="hover:text-ink transition-colors">
              Partner Disclosures
            </Link>
            <a
              href={twitterLink}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink transition-colors"
            >
              X (Twitter)
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

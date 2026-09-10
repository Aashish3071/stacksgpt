import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import Logo from "@/components/Logo";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-rule bg-surface">
      <div className="mx-auto max-w-shell px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="max-w-measure">
            <Link href="/" className="inline-block">
              <Logo size="sm" />
            </Link>
            <p className="meta mt-3 leading-relaxed">
              Stack the facts. Skip the hype. We report what&apos;s new in AI and what actually matters.
            </p>
          </div>

          <nav className="font-sans text-meta">
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-muted hover:text-ink">
                  Latest
                </Link>
              </li>
              <li>
                <Link href="/tools" className="text-muted hover:text-ink">
                  AI tools directory
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted hover:text-ink">
                  About
                </Link>
              </li>
              <li>
                <Link href="/editorial-standards" className="text-muted hover:text-ink">
                  Editorial standards
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted hover:text-ink">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted hover:text-ink">
                  Contact
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-10 border-t border-rule pt-6">
          <p className="meta" suppressHydrationWarning>
            © {new Date().getFullYear()} {SITE_NAME}. Some links to tools may be partner links,
            which are labelled as such where they appear.
          </p>
        </div>
      </div>
    </footer>
  );
}

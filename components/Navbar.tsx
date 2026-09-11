"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORIES, categoryHref } from "@/lib/site";
import Logo from "@/components/Logo";

/**
 * One compact bar.
 *
 * This used to be three stacked rows — a dateline strip, a centred masthead with
 * a tagline, and a nav — which took 213px, about 30% of a laptop viewport,
 * before the reader saw a single headline. Chrome does not earn pageviews;
 * headlines do.
 */
export default function Navbar({
  categories,
}: {
  categories: { name: string; slug: string }[];
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href;

  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-shell items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="group shrink-0">
          <Logo size="md" />
        </Link>

        <nav className="min-w-0 flex-1">
          <ul
            aria-label="Browse sections"
            className="-mx-2 flex items-center gap-0.5 overflow-x-auto font-sans text-meta [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <li>
              <Link className="px-2" href="/latest">
                Latest
              </Link>
            </li>
            <li>
              <Link className="px-2" href="/archive">
                Archive
              </Link>
            </li>
            <li>
              <Link className="px-2" href="/search">
                Search
              </Link>
            </li>
            {categories.map(({ name: cat, slug }) => {
              const href = `/category/${slug}`;
              return (
                <li key={cat}>
                  <Link
                    href={href}
                    className={`whitespace-nowrap px-2 py-1 transition-colors ${
                      isActive(href)
                        ? "font-medium text-ink"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    {cat}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <Link
          href="/tools"
          className={`hidden shrink-0 font-sans text-meta transition-colors sm:block ${
            isActive("/tools")
              ? "font-medium text-ink"
              : "text-muted hover:text-ink"
          }`}
        >
          Tools
        </Link>
      </div>
    </header>
  );
}

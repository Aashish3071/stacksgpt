"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { categoryHref } from "@/lib/site";
import Logo from "@/components/Logo";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatEditorialDate(): string {
  const d = new Date();
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/**
 * Two-Tier Newspaper Masthead.
 *
 * Row 1: Thin utility strip (date left, search/newsletter/about right)
 * Row 2: Logo on LEFT + brand name, centered category navigation
 * Mobile: hamburger drawer for all navigation links
 */
export default function Navbar({
  categories,
}: {
  categories: { name: string; slug: string }[];
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href;

  const navCategories = categories.filter(
    (c) => c.name.toLowerCase() !== "writing",
  );

  const navLinks = [
    { label: "Latest", href: "/latest" },
    ...navCategories.map((c) => ({
      label: c.name,
      href: `/category/${c.slug}`,
    })),
    { label: "Tools", href: "/tools" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur">
      {/* Row 1: Utility strip */}
      <div className="border-b border-rule">
        <div className="mx-auto flex h-7 max-w-shell items-center justify-between px-4 sm:px-6">
          <span
            className="font-sans text-[11px] tracking-wide text-muted"
            suppressHydrationWarning
          >
            {formatEditorialDate()}
          </span>
          <nav className="hidden items-center gap-4 font-sans text-[11px] text-muted sm:flex">
            <Link href="/search" className="hover:text-ink transition-colors">
              Search
            </Link>
            <Link href="/about" className="hover:text-ink transition-colors">
              About
            </Link>
            <Link
              href="#newsletter"
              className="hover:text-ink transition-colors"
            >
              Newsletter
            </Link>
          </nav>
          {/* Mobile hamburger */}
          <button
            type="button"
            className="flex items-center justify-center sm:hidden"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="text-muted"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Row 2: Logo LEFT + Category Navigation */}
      <div className="border-b border-rule">
        <div className="mx-auto flex h-12 max-w-shell items-center gap-6 px-4 sm:px-6">
          <Link href="/" className="group shrink-0">
            <Logo size="md" />
          </Link>

          {/* Category nav: fills remaining space, centered */}
          <nav className="hidden min-w-0 flex-1 sm:block">
            <ul
              aria-label="Browse sections"
              className="flex items-center justify-center gap-1 overflow-x-auto font-sans text-[13px] font-medium [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {navLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={`whitespace-nowrap px-3 py-1.5 transition-colors ${
                      isActive(href)
                        ? "text-ink border-b-2 border-ink"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] sm:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="absolute right-0 top-0 h-full w-72 bg-surface shadow-xl">
            <div className="flex h-14 items-center justify-between border-b border-rule px-4">
              <Logo size="sm" />
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setMobileOpen(false)}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="text-muted"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <nav className="px-4 py-4">
              <ul className="space-y-1 font-sans text-sm">
                {navLinks.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`block rounded-md px-3 py-2.5 transition-colors ${
                        isActive(href)
                          ? "bg-accent/10 font-medium text-ink"
                          : "text-muted hover:bg-paper hover:text-ink"
                      }`}
                      onClick={() => setMobileOpen(false)}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-6 border-t border-rule pt-4">
                <ul className="space-y-1 font-sans text-sm">
                  {[
                    { label: "Search", href: "/search" },
                    { label: "About", href: "/about" },
                    { label: "Newsletter", href: "#newsletter" },
                    { label: "Contact", href: "/contact" },
                  ].map(({ label, href }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="block rounded-md px-3 py-2.5 text-muted transition-colors hover:bg-paper hover:text-ink"
                        onClick={() => setMobileOpen(false)}
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

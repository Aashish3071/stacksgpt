"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import Logo from "@/components/Logo";
import SearchModal from "@/components/SearchModal";
import SubscribeModal from "@/components/SubscribeModal";

interface CategoryItem {
  name: string;
  slug: string;
  description?: string;
}

const CATEGORY_ITEMS: CategoryItem[] = [
  {
    name: "Productivity",
    slug: "productivity",
    description: "Daily workflows, office apps, and task tools",
  },
  {
    name: "Coding",
    slug: "coding",
    description: "Developer tools, copilots, and AI agents",
  },
  {
    name: "Design",
    slug: "design",
    description: "Image generation, UI kits, and creative tech",
  },
  {
    name: "Automation",
    slug: "automation",
    description: "Workflows, robotics, and unattended operations",
  },
];

export default function Navbar({
  categories: _categories,
}: {
  categories?: { name: string; slug: string }[];
}) {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setDropdownOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  // Lock background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Global keyboard shortcuts (Cmd+K for search, Escape to close menus)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setMobileOpen(false);
        setDropdownOpen(false);
        setSearchOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href;

  const isCategoryActive = CATEGORY_ITEMS.some(
    (c) => pathname === `/category/${c.slug}`,
  );

  // Suppress public navbar on all administrative routes
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-rule bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-shell items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6">
          {/* Left: Brand + Core Nav Links */}
          <div className="flex items-center gap-4 lg:gap-8 min-w-0">
            <Link href="/" className="group shrink-0 flex items-center" aria-label="StacksGPT Home">
              <Logo size="md" />
            </Link>

            <nav className="hidden items-center gap-1 font-sans text-[13px] font-medium sm:flex">
              <Link
                href="/latest"
                prefetch={true}
                className={`rounded-md px-3 py-1.5 transition-colors ${
                  isActive("/latest")
                    ? "bg-paper font-semibold text-ink"
                    : "text-muted hover:text-ink"
                }`}
                title="All breaking stories"
              >
                Latest
              </Link>

              <Link
                href="/category/research"
                prefetch={true}
                className={`rounded-md px-3 py-1.5 transition-colors ${
                  isActive("/category/research")
                    ? "bg-paper font-semibold text-ink"
                    : "text-muted hover:text-ink"
                }`}
                title="Model launches, benchmarks, lab news"
              >
                Research & Models
              </Link>

              <Link
                href="/tools"
                prefetch={true}
                className={`rounded-md px-3 py-1.5 transition-colors ${
                  isActive("/tools")
                    ? "bg-paper font-semibold text-ink"
                    : "text-muted hover:text-ink"
                }`}
                title="Dedicated directory of AI software and agents"
              >
                Tools
              </Link>

              {/* Category Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors ${
                    isCategoryActive || dropdownOpen
                      ? "bg-paper font-semibold text-ink"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  <span>Category</span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform duration-200 ${
                      dropdownOpen ? "rotate-180 text-ink" : "text-muted"
                    }`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Dropdown Menu Popover */}
                {dropdownOpen && (
                  <div className="absolute left-0 top-full mt-2 w-72 rounded-xl border border-rule bg-surface p-2 shadow-xl ring-1 ring-black/5">
                    <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                      Browse by Category
                    </div>

                    <div className="space-y-0.5">
                      {CATEGORY_ITEMS.map((item) => {
                        const href = `/category/${item.slug}`;
                        const active = pathname === href;
                        return (
                          <Link
                            key={item.slug}
                            href={href}
                            prefetch={true}
                            onClick={() => setDropdownOpen(false)}
                            className={`group flex flex-col rounded-lg px-3 py-2 text-left transition-colors ${
                              active
                                ? "bg-paper font-medium text-ink"
                                : "hover:bg-paper"
                            }`}
                          >
                            <span className="text-[13px] font-medium text-ink group-hover:text-accent">
                              {item.name}
                            </span>
                            {item.description && (
                              <span className="text-[11px] text-muted line-clamp-1">
                                {item.description}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Right: Search Icon + Subscribe CTA + Mobile Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-paper hover:text-ink transition-colors shrink-0"
              aria-label="Search articles"
              title="Search (⌘K)"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {/* Desktop Subscribe CTA */}
            <button
              type="button"
              onClick={() => setSubscribeOpen(true)}
              className="hidden sm:inline-flex rounded-full bg-ink px-4 py-1.5 font-sans text-xs sm:text-[13px] font-semibold text-surface transition-all hover:bg-ink/90 shadow-sm hover:scale-[1.02] active:scale-[0.98] shrink-0"
            >
              Subscribe
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-paper hover:text-ink sm:hidden transition-colors shrink-0"
              aria-label={mobileOpen ? "Close mobile menu" : "Open mobile menu"}
            >
              {mobileOpen ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Full-Screen Navigation Menu */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-[100] sm:hidden flex flex-col bg-surface overflow-hidden animate-in fade-in duration-150"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Top Bar: Matches site header height and padding precisely */}
            <div className="flex h-14 items-center justify-between border-b border-rule px-4 bg-surface shrink-0">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                aria-label="StacksGPT Home"
                className="flex items-center"
              >
                <Logo size="md" />
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-paper hover:text-ink transition-colors"
                aria-label="Close navigation menu"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Scrollable Navigation Body */}
            <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col justify-between">
              <div className="space-y-6">
                {/* Search Trigger Input */}
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    setSearchOpen(true);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-rule bg-paper px-3.5 py-3 text-left font-sans text-sm text-muted hover:border-ink hover:text-ink transition-colors min-h-[44px]"
                  aria-label="Search articles"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-muted shrink-0"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <span className="flex-1">Search articles, models, tools...</span>
                  <kbd className="rounded border border-rule bg-surface px-1.5 py-0.5 text-[10px] font-mono text-muted">
                    ⌘K
                  </kbd>
                </button>

                {/* Primary Navigation */}
                <div className="space-y-1 font-sans">
                  <Link
                    href="/latest"
                    prefetch={true}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium transition-colors min-h-[44px] ${
                      isActive("/latest")
                        ? "bg-paper font-semibold text-ink"
                        : "text-muted hover:bg-paper hover:text-ink"
                    }`}
                  >
                    <span>Latest</span>
                    <span className="text-xs text-muted">Breaking stories →</span>
                  </Link>
                  <Link
                    href="/category/research"
                    prefetch={true}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium transition-colors min-h-[44px] ${
                      isActive("/category/research")
                        ? "bg-paper font-semibold text-ink"
                        : "text-muted hover:bg-paper hover:text-ink"
                    }`}
                  >
                    <span>Research &amp; Models</span>
                    <span className="text-xs text-muted">Launches &amp; lab news →</span>
                  </Link>
                  <Link
                    href="/tools"
                    prefetch={true}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium transition-colors min-h-[44px] ${
                      isActive("/tools")
                        ? "bg-paper font-semibold text-ink"
                        : "text-muted hover:bg-paper hover:text-ink"
                    }`}
                  >
                    <span>Tools Directory</span>
                    <span className="text-xs text-muted">Software &amp; agents →</span>
                  </Link>
                </div>

                {/* Categories Grid */}
                <div className="border-t border-rule pt-4">
                  <p className="px-1 text-xs font-semibold uppercase tracking-wider text-muted mb-3">
                    Categories
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORY_ITEMS.map((item) => {
                      const active = pathname === `/category/${item.slug}`;
                      return (
                        <Link
                          key={item.slug}
                          href={`/category/${item.slug}`}
                          prefetch={true}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center rounded-xl border px-3 py-2.5 font-sans text-sm font-medium transition-colors min-h-[44px] ${
                            active
                              ? "border-ink bg-paper font-semibold text-ink"
                              : "border-rule/60 bg-paper/50 text-muted hover:border-ink hover:text-ink hover:bg-paper"
                          }`}
                        >
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Actions: Subscribe + Social */}
              <div className="border-t border-rule pt-5 mt-6 space-y-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    setSubscribeOpen(true);
                  }}
                  className="w-full rounded-xl bg-ink py-3 text-center font-sans text-sm font-semibold text-surface shadow-sm transition-all hover:bg-ink/90 min-h-[44px]"
                >
                  Subscribe to Newsletter
                </button>

                <a
                  href="https://x.com/StacksGPT01"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-rule bg-paper py-2.5 font-sans text-xs font-medium text-ink transition-colors hover:border-ink hover:bg-surface min-h-[44px]"
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
          </div>
        )}
      </header>

      {/* Global Modals */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
      <SubscribeModal
        isOpen={subscribeOpen}
        onClose={() => setSubscribeOpen(false)}
      />
    </>
  );
}

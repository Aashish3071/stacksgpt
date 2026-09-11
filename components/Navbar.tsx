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
    name: "Writing",
    slug: "writing",
    description: "Editorial tools, content models, and text AI",
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

  // Close on route change
  useEffect(() => {
    setDropdownOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  // Global keyboard shortcut for search (Cmd+K or Ctrl+K)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href;

  const isCategoryActive = CATEGORY_ITEMS.some(
    (c) => pathname === `/category/${c.slug}`,
  ) || pathname === "/archive";

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-rule bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-shell items-center justify-between gap-4 px-4 sm:px-6">
          {/* Left: Brand + Core Nav Links */}
          <div className="flex items-center gap-6 lg:gap-8">
            <Link href="/" className="group shrink-0" aria-label="Stacksgpt Home">
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

                    <div className="my-1.5 border-t border-rule" />

                    <Link
                      href="/archive"
                      prefetch={true}
                      onClick={() => setDropdownOpen(false)}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                        pathname === "/archive"
                          ? "bg-paper font-semibold text-ink"
                          : "text-muted hover:bg-paper hover:text-ink"
                      }`}
                    >
                      <span>Full Archive</span>
                      <span className="text-xs text-muted">All stories →</span>
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Right: Search Icon + Subscribe CTA */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-paper hover:text-ink transition-colors"
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

            <button
              type="button"
              onClick={() => setSubscribeOpen(true)}
              className="rounded-full bg-ink px-4 py-1.5 font-sans text-xs sm:text-[13px] font-semibold text-surface transition-all hover:bg-ink/90 shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              Subscribe
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-paper hover:text-ink sm:hidden transition-colors"
              aria-label="Toggle mobile menu"
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
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Slide-Over Drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-[100] sm:hidden">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-surface p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-center justify-between border-b border-rule pb-4">
                  <Logo size="sm" />
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="rounded p-1 text-muted hover:bg-paper hover:text-ink"
                    aria-label="Close menu"
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

                {/* Primary navigation */}
                <div className="mt-6 space-y-1 font-sans text-sm">
                  <Link
                    href="/latest"
                    prefetch={true}
                    onClick={() => setMobileOpen(false)}
                    className={`block rounded-lg px-3 py-2.5 font-medium transition-colors ${
                      isActive("/latest")
                        ? "bg-paper font-semibold text-ink"
                        : "text-muted hover:bg-paper hover:text-ink"
                    }`}
                  >
                    Latest
                  </Link>
                  <Link
                    href="/category/research"
                    prefetch={true}
                    onClick={() => setMobileOpen(false)}
                    className={`block rounded-lg px-3 py-2.5 font-medium transition-colors ${
                      isActive("/category/research")
                        ? "bg-paper font-semibold text-ink"
                        : "text-muted hover:bg-paper hover:text-ink"
                    }`}
                  >
                    Research & Models
                  </Link>
                  <Link
                    href="/tools"
                    prefetch={true}
                    onClick={() => setMobileOpen(false)}
                    className={`block rounded-lg px-3 py-2.5 font-medium transition-colors ${
                      isActive("/tools")
                        ? "bg-paper font-semibold text-ink"
                        : "text-muted hover:bg-paper hover:text-ink"
                    }`}
                  >
                    Tools
                  </Link>
                </div>

                {/* Category section */}
                <div className="mt-6 border-t border-rule pt-4">
                  <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted">
                    Category
                  </p>
                  <div className="mt-2 space-y-1 font-sans text-sm">
                    {CATEGORY_ITEMS.map((item) => (
                      <Link
                        key={item.slug}
                        href={`/category/${item.slug}`}
                        prefetch={true}
                        onClick={() => setMobileOpen(false)}
                        className={`block rounded-lg px-3 py-2 transition-colors ${
                          pathname === `/category/${item.slug}`
                            ? "bg-paper font-medium text-ink"
                            : "text-muted hover:bg-paper hover:text-ink"
                        }`}
                      >
                        {item.name}
                      </Link>
                    ))}
                    <Link
                      href="/archive"
                      prefetch={true}
                      onClick={() => setMobileOpen(false)}
                      className={`block rounded-lg px-3 py-2 transition-colors ${
                        pathname === "/archive"
                          ? "bg-paper font-medium text-ink"
                          : "text-muted hover:bg-paper hover:text-ink"
                      }`}
                    >
                      Archive
                    </Link>
                  </div>
                </div>
              </div>

              {/* Mobile CTA */}
              <div className="border-t border-rule pt-6 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    setSubscribeOpen(true);
                  }}
                  className="w-full rounded-lg bg-ink py-2.5 text-center font-sans text-sm font-semibold text-surface shadow-sm"
                >
                  Subscribe
                </button>
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

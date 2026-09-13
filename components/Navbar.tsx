"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Logo from "@/components/Logo";
import SearchModal from "@/components/SearchModal";
import SubscribeModal from "@/components/SubscribeModal";

const NEWS_CATEGORIES = [
  { name: "Productivity", slug: "productivity", desc: "Workflows & tools" },
  { name: "Writing", slug: "writing", desc: "Language models & copy" },
  { name: "Coding", slug: "coding", desc: "Developer agents & IDEs" },
  { name: "Research & Models", slug: "research", desc: "Lab breakthroughs & papers" },
  { name: "Design", slug: "design", desc: "Generative UI & vision" },
  { name: "Automation", slug: "automation", desc: "Orchestration & pipelines" },
];

export default function Navbar({
  categories: _categories,
}: {
  categories?: { name: string; slug: string }[];
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [newsDropdownOpen, setNewsDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const newsDropdownRef = useRef<HTMLDivElement>(null);

  // Portal target must wait for the client; document isn't available during SSR.
  useEffect(() => setMounted(true), []);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setNewsDropdownOpen(false);
  }, [pathname]);

  // Click outside news dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        newsDropdownRef.current &&
        !newsDropdownRef.current.contains(e.target as Node)
      ) {
        setNewsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        setSearchOpen(false);
        setNewsDropdownOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href;

  const isNewsActive =
    pathname === "/latest" ||
    pathname.startsWith("/category/") ||
    pathname.startsWith("/article/");

  // Suppress public navbar on all administrative routes
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-rule bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-shell items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6">
          {/* Left: Brand + Primary Nav Links */}
          <div className="flex items-center gap-4 lg:gap-8 min-w-0">
            <Link href="/" className="group shrink-0 flex items-center min-h-[44px]" aria-label="StacksGPT Home">
              <Logo size="md" />
            </Link>

            <nav className="hidden items-center gap-1 font-sans text-[13px] font-medium sm:flex">
              <Link
                href="/blueprints"
                prefetch={true}
                className={`rounded-md px-3 py-2 transition-colors min-h-[36px] flex items-center ${
                  isActive("/blueprints")
                    ? "bg-paper font-semibold text-ink"
                    : "text-muted hover:text-ink"
                }`}
                title="Actionable AI workflows, templates, and automation playbooks"
              >
                Blueprints
              </Link>

              {/* AI News with Category Dropdown */}
              <div
                ref={newsDropdownRef}
                className="relative"
                onMouseEnter={() => setNewsDropdownOpen(true)}
                onMouseLeave={() => setNewsDropdownOpen(false)}
              >
                <div className="flex items-center">
                  <Link
                    href="/latest"
                    prefetch={true}
                    className={`rounded-l-md pl-3 pr-1.5 py-2 transition-colors min-h-[36px] flex items-center ${
                      isNewsActive
                        ? "bg-paper font-semibold text-ink"
                        : "text-muted hover:text-ink"
                    }`}
                    title="Reported artificial intelligence news and frontier model releases"
                  >
                    AI News
                  </Link>
                  <button
                    type="button"
                    onClick={() => setNewsDropdownOpen((prev) => !prev)}
                    className={`rounded-r-md pr-2.5 pl-1 py-2 transition-colors min-h-[36px] flex items-center ${
                      isNewsActive
                        ? "bg-paper text-ink"
                        : "text-muted hover:text-ink"
                    }`}
                    aria-label="Toggle AI News categories"
                    aria-expanded={newsDropdownOpen}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`transition-transform duration-150 ${
                        newsDropdownOpen ? "rotate-180" : ""
                      }`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>

                {/* Dropdown Menu */}
                {newsDropdownOpen && (
                  <div className="absolute left-0 top-full pt-1 z-50 w-64 animate-in fade-in slide-in-from-top-1 duration-100">
                    <div className="rounded-lg border border-rule bg-surface p-2 shadow-lg">
                      <div className="border-b border-rule/70 px-2.5 pb-2 pt-1">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-semibold">
                          Editorial News Topics
                        </span>
                      </div>
                      <div className="pt-1.5 space-y-0.5">
                        {NEWS_CATEGORIES.map((cat) => (
                          <Link
                            key={cat.slug}
                            href={`/category/${cat.slug}`}
                            prefetch={true}
                            onClick={() => setNewsDropdownOpen(false)}
                            className="flex flex-col rounded-md px-2.5 py-1.5 transition-colors hover:bg-paper"
                          >
                            <span className="font-sans text-xs font-semibold text-ink">
                              {cat.name}
                            </span>
                            <span className="text-[11px] text-muted line-clamp-1">
                              {cat.desc}
                            </span>
                          </Link>
                        ))}
                      </div>
                      <div className="mt-1.5 border-t border-rule/70 pt-1.5 px-2.5">
                        <Link
                          href="/latest"
                          prefetch={true}
                          onClick={() => setNewsDropdownOpen(false)}
                          className="flex items-center justify-between text-xs font-semibold text-accent hover:underline py-1"
                        >
                          <span>All AI News</span>
                          <span>→</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Link
                href="/tools"
                prefetch={true}
                className={`rounded-md px-3 py-2 transition-colors min-h-[36px] flex items-center ${
                  isActive("/tools")
                    ? "bg-paper font-semibold text-ink"
                    : "text-muted hover:text-ink"
                }`}
                title="Directory of artificial intelligence tools and software"
              >
                Tools
              </Link>
            </nav>
          </div>

          {/* Right: Search Icon + Primary "Talk to Us" Priority CTA + Mobile Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:bg-paper hover:text-ink transition-colors shrink-0"
              aria-label="Search articles and workflows"
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
              className="hidden sm:inline-flex min-h-[36px] items-center rounded-md px-3 py-2 font-sans text-[13px] font-medium text-ink transition-colors hover:text-accent"
            >
              Subscribe
            </button>

            {/* Desktop Priority CTA: Talk to Us (Build Custom Automation or AI tools) */}
            <Link
              href="/contact"
              prefetch={true}
              className="hidden sm:inline-flex rounded-full bg-ink px-4 py-2 font-sans text-xs sm:text-[13px] font-semibold text-surface transition-all hover:bg-ink/90 shadow-sm hover:scale-[1.02] active:scale-[0.98] shrink-0 min-h-[36px] items-center gap-1.5"
              title="Talk to us to build custom Automation or AI tools"
            >
              <span>Talk to Us</span>
            </Link>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:bg-paper hover:text-ink sm:hidden transition-colors shrink-0"
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
        {mobileOpen &&
          mounted &&
          createPortal(
            <div
              className="fixed inset-0 z-[100] sm:hidden flex flex-col bg-surface overflow-hidden animate-in fade-in duration-150"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
              {/* Top Bar */}
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
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:bg-paper hover:text-ink transition-colors"
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
                    aria-label="Search articles and workflows"
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
                    <span className="flex-1">Search workflows, news, tools...</span>
                    <kbd className="rounded border border-rule bg-surface px-1.5 py-0.5 text-[10px] font-mono text-muted">
                      ⌘K
                    </kbd>
                  </button>

                  {/* Primary Navigation */}
                  <div className="space-y-1 font-sans">
                    <Link
                      href="/blueprints"
                      prefetch={true}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium transition-colors min-h-[44px] ${
                        isActive("/blueprints")
                          ? "bg-paper font-semibold text-ink"
                          : "text-muted hover:bg-paper hover:text-ink"
                      }`}
                    >
                      <span>Blueprints</span>
                      <span className="text-xs text-muted">Workflows &amp; templates →</span>
                    </Link>

                    <div className="rounded-xl border border-rule/60 bg-paper/50 p-2">
                      <Link
                        href="/latest"
                        prefetch={true}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 text-base font-medium transition-colors ${
                          isNewsActive
                            ? "bg-paper font-semibold text-ink"
                            : "text-muted hover:bg-paper hover:text-ink"
                        }`}
                      >
                        <span>AI News</span>
                        <span className="text-xs text-muted">All News →</span>
                      </Link>
                      <div className="mt-1.5 grid grid-cols-2 gap-1.5 border-t border-rule/60 pt-2 px-1">
                        {NEWS_CATEGORIES.map((cat) => (
                          <Link
                            key={cat.slug}
                            href={`/category/${cat.slug}`}
                            prefetch={true}
                            onClick={() => setMobileOpen(false)}
                            className="rounded px-2 py-1.5 text-xs text-muted hover:bg-surface hover:text-ink transition-colors"
                          >
                            {cat.name}
                          </Link>
                        ))}
                      </div>
                    </div>

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

                    <Link
                      href="/contact"
                      prefetch={true}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium transition-colors min-h-[44px] ${
                        isActive("/contact")
                          ? "bg-paper font-semibold text-ink"
                          : "text-muted hover:bg-paper hover:text-ink"
                      }`}
                    >
                      <span>Talk to Us</span>
                      <span className="text-xs text-accent font-medium">Custom automation &amp; AI →</span>
                    </Link>
                  </div>
                </div>

                {/* Bottom Actions: Priority Talk to Us Button + Social */}
                <div className="border-t border-rule pt-5 mt-6 space-y-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      setSubscribeOpen(true);
                    }}
                    className="w-full rounded-xl border border-ink py-3 text-center font-sans text-sm font-semibold text-ink transition-colors hover:bg-paper min-h-[44px] flex items-center justify-center"
                  >
                    Subscribe to the newsletter
                  </button>
                  <Link
                    href="/contact"
                    prefetch={true}
                    onClick={() => setMobileOpen(false)}
                    className="w-full rounded-xl bg-ink py-3 text-center font-sans text-sm font-semibold text-surface shadow-sm transition-all hover:bg-ink/90 min-h-[44px] flex items-center justify-center gap-1"
                  >
                    <span>Talk to Us</span>
                    <span className="font-normal text-xs text-surface/80">(Custom Automation &amp; AI)</span>
                  </Link>

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
            </div>,
            document.body,
          )}
      </header>

      {/* Global Search Modal */}
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

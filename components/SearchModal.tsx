"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: Props) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setQuery("");
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onClose();
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const popularTopics = [
    { label: "Claude", href: "/search?q=claude" },
    { label: "OpenAI", href: "/search?q=openai" },
    { label: "DeepSeek", href: "/search?q=deepseek" },
    { label: "Coding agents", href: "/search?q=coding+agents" },
    { label: "Automation", href: "/category/automation" },
    { label: "Research", href: "/category/research" },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-16 sm:pt-24">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl rounded-xl border border-rule bg-surface p-6 shadow-2xl transition-all">
        <div className="flex items-center justify-between border-b border-rule pb-4">
          <h2 className="font-serif text-lg font-semibold text-ink">
            Search StacksGPT
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted hover:bg-paper hover:text-ink transition-colors"
            aria-label="Close search"
          >
            <svg
              width="18"
              height="18"
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

        <form onSubmit={handleSubmit} className="mt-4">
          <div className="relative flex items-center">
            <svg
              className="absolute left-3.5 h-4 w-4 text-muted pointer-events-none"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search news, models, tools, companies..."
              className="w-full rounded-lg border border-rule bg-paper py-3 pl-10 pr-12 font-sans text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
            />
            {query && (
              <button
                type="submit"
                className="absolute right-2.5 rounded px-2 py-1 font-sans text-xs font-medium text-ink hover:bg-surface transition-colors"
              >
                Search
              </button>
            )}
          </div>
        </form>

        <div className="mt-5 border-t border-rule pt-4">
          <p className="meta text-xs uppercase tracking-wider text-muted font-semibold">
            Popular searches
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {popularTopics.map((topic) => (
              <Link
                key={topic.label}
                href={topic.href}
                prefetch={true}
                onClick={onClose}
                className="rounded-full border border-rule bg-paper px-3 py-1 font-sans text-xs text-muted hover:border-ink hover:text-ink transition-colors"
              >
                {topic.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-rule pt-3 text-[11px] text-muted">
          <span>Press Enter to search</span>
          <span>Press Esc to close</span>
        </div>
      </div>
    </div>
  );
}

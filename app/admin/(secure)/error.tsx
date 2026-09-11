"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Newsroom section error:", error);
  }, [error]);

  return (
    <div className="rounded-xl border border-rule bg-surface p-8 max-w-xl mx-auto my-12 text-center shadow-sm">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent mb-4">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <h2 className="font-serif text-2xl font-semibold text-ink">
        Newsroom section unavailable
      </h2>
      <p className="mt-2 text-sm text-muted">
        We encountered an error loading this editorial view. Try refreshing the section or return to the dashboard.
      </p>

      {error?.message && (
        <pre className="mt-4 p-3 bg-paper border border-rule rounded text-xs text-left font-mono text-muted overflow-x-auto">
          {error.message}
        </pre>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-ink px-4 py-2 font-sans text-xs font-semibold text-surface hover:bg-ink/90 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/admin"
          className="rounded-lg border border-rule px-4 py-2 font-sans text-xs font-semibold text-ink hover:bg-paper transition-colors"
        >
          Newsroom dashboard
        </Link>
        <Link
          href="/admin/login"
          className="rounded-lg border border-rule px-4 py-2 font-sans text-xs font-semibold text-muted hover:text-ink hover:bg-paper transition-colors"
        >
          Sign in again
        </Link>
      </div>
    </div>
  );
}

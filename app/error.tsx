"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Uncaught page error:", error);
  }, [error]);

  return (
    <section className="mx-auto max-w-xl px-6 py-20 text-center">
      <h1 className="font-serif text-head-lg font-semibold text-ink">
        We couldn’t load this page.
      </h1>
      <p className="my-5 font-serif text-muted">
        Please try again, or return to the front page while we resolve this.
      </p>
      <div className="flex justify-center gap-4">
        <button
          onClick={reset}
          className="border border-rule px-5 py-2.5 rounded font-sans text-sm font-medium hover:bg-muted/10 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="bg-ink text-surface px-5 py-2.5 rounded font-sans text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Front page
        </Link>
      </div>
    </section>
  );
}

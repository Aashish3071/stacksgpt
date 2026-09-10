import type { ReactNode } from "react";

/** Shared shell for the static policy pages, so they read as one voice. */
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-measure px-4 py-12 sm:px-6">
      <h1 className="font-serif text-head-lg font-semibold text-ink">{title}</h1>
      <div className="article-prose mt-6 space-y-5">{children}</div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";

export function NewArticle() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <>
      <button
        disabled={busy}
        className="rounded bg-ink text-paper px-4 py-2 text-sm font-semibold hover:bg-ink/90 transition-colors disabled:opacity-50"
        onClick={async () => {
          setBusy(true);
          try {
            const r = await fetch("/api/newsroom/new-article", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: "{}",
            });
            const d = await r.json();
            if (!r.ok) throw Error(d.error);
            window.location.assign(`/admin/articles/${d.id}`);
          } catch (e) {
            setMessage(String(e instanceof Error ? e.message : e));
            setBusy(false);
          }
        }}
      >
        {busy ? "Creating draft..." : "+ New article"}
      </button>
      {message && <p role="status" className="text-xs text-accent mt-2">{message}</p>}
    </>
  );
}

export function DeleteArticleButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        const confirmed = confirm(
          `Permanently delete "${title || "this article"}"? This action cannot be undone.`,
        );
        if (!confirmed) return;
        setBusy(true);
        try {
          const r = await fetch(`/api/articles?id=${encodeURIComponent(id)}`, {
            method: "DELETE",
          });
          const d = await r.json();
          if (!r.ok) throw Error(d.error || "Deletion failed");
          window.location.reload();
        } catch (e) {
          alert(e instanceof Error ? e.message : "Failed to delete article");
          setBusy(false);
        }
      }}
      className="rounded border border-accent/40 bg-surface px-2.5 py-1 text-xs font-semibold text-accent hover:bg-accent-soft hover:border-accent transition-colors disabled:opacity-40"
    >
      {busy ? "Deleting..." : "Delete"}
    </button>
  );
}

export function ArticleActions({ article }: { article: any }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2.5">
      <Link
        href={`/admin/articles/${article.id}`}
        className="rounded border border-rule bg-paper px-3 py-1 font-sans text-xs font-semibold text-ink hover:border-ink hover:bg-surface transition-colors"
      >
        Edit article
      </Link>
      <Link
        href={`/admin/preview/${article.id}`}
        target="_blank"
        className="rounded border border-rule px-3 py-1 font-sans text-xs font-semibold text-muted hover:text-ink hover:border-ink transition-colors"
      >
        Private preview ↗
      </Link>
      <DeleteArticleButton id={article.id} title={article.title} />
    </div>
  );
}

export function LeadActions({ lead }: { lead: any }) {
  const [status, setStatus] = useState(lead.status);
  const [notes, setNotes] = useState(lead.notes || "");
  const [duplicateOf, setDuplicateOf] = useState(lead.duplicateOf || "");
  const [message, setMessage] = useState("");

  return (
    <div className="space-y-3">
      <select
        className="border border-rule p-2 text-sm rounded bg-surface"
        aria-label="Lead status"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        {["PENDING", "SHORTLISTED", "IGNORED", "SELECTED"].map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
      <label className="block text-sm">
        Editorial notes
        <textarea
          className="border border-rule block w-full p-2 mt-1 text-sm rounded bg-surface"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        Duplicate lead ID (optional)
        <input
          className="border border-rule block w-full p-2 mt-1 text-sm rounded bg-surface"
          value={duplicateOf}
          onChange={(e) => setDuplicateOf(e.target.value)}
        />
      </label>
      <button
        className="border border-rule px-4 py-1.5 text-xs font-semibold rounded hover:border-ink transition-colors"
        onClick={async () => {
          const r = await fetch("/api/newsroom/leads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: lead.id,
              status,
              notes,
              duplicateOf: duplicateOf || null,
            }),
          });
          const d = await r.json();
          setMessage(r.ok ? "Saved." : d.error);
        }}
      >
        Save decision
      </button>
      {message && <p role="status" className="text-xs text-accent">{message}</p>}
    </div>
  );
}

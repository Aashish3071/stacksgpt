"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-surface text-muted border-rule",
  IN_REVIEW: "bg-amber-50 text-amber-800 border-amber-200",
  APPROVED: "bg-sky-50 text-sky-800 border-sky-200",
  SCHEDULED: "bg-violet-50 text-violet-800 border-violet-200",
  PUBLISHED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  REJECTED: "bg-rose-50 text-rose-800 border-rose-200",
  ARCHIVED: "bg-surface text-muted border-rule",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
        STATUS_STYLE[status] || "bg-surface text-muted border-rule"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

/**
 * One article, as a browsable card rather than a plain text row.
 *
 * Every status queue (drafts, in review, approved, scheduled, published,
 * rejected, archived) renders these in a responsive grid. A CMS content list
 * is scanned by eye via its thumbnails — a queue of bare title links gives an
 * editor nothing to recognise an article by until they click into it.
 *
 * The whole card is a link to the editor, matching how every other CMS treats
 * "click the item to edit it" — the explicit Edit button in the footer exists
 * for keyboard and screen-reader users who tab through actions rather than
 * activate the card region, and for anyone scanning the row of buttons rather
 * than the card itself.
 */
export function ArticleTile({ article: a }: { article: any }) {
  const status = a.pendingStatus || a.status;
  const editHref = `/admin/articles/${a.id}`;
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-rule bg-surface transition-colors focus-within:border-ink hover:border-ink">
      <Link
        href={editHref}
        className="absolute inset-0 z-10 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
        aria-label={`Edit "${a.title || "Untitled article"}"`}
      />
      <div className="relative aspect-[16/9] w-full shrink-0 bg-paper">
        {a.heroImage ? (
          <Image
            src={a.heroImage}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted">
            No image
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
          <StatusBadge status={status} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-serif text-lg font-semibold leading-snug text-ink line-clamp-2">
          {a.title || "Untitled article"}
        </h3>
        <p className="text-xs text-muted">
          {a.category}
          {a.sourceAuthor ? ` · ${a.sourceAuthor}` : ""}
          {a.scheduledFor
            ? ` · Scheduled ${new Date(a.scheduledFor).toLocaleDateString()}`
            : a.publishedAt
              ? ` · ${new Date(a.publishedAt).toLocaleDateString()}`
              : ""}
        </p>
        {a.rejectionReason && (
          <p className="rounded border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-800">
            {a.rejectionReason}
          </p>
        )}
        <div className="relative z-20 mt-auto pt-2">
          <ArticleActions article={a} />
        </div>
      </div>
    </article>
  );
}

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

export function PublishArticleButton({ article }: { article: any }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const r = await fetch("/api/articles", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: article.id,
              action: "publish",
              version: article.version,
            }),
          });
          const d = await r.json();
          if (!r.ok) throw Error(d.error || "Publication failed");
          window.location.reload();
        } catch (e) {
          alert(e instanceof Error ? e.message : "Failed to publish");
          setBusy(false);
        }
      }}
      className="rounded bg-emerald-600 text-white px-3 py-1 font-sans text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
    >
      {busy ? "Publishing..." : "Publish now"}
    </button>
  );
}

export function ArticleActions({ article }: { article: any }) {
  const isApproved =
    article.status === "APPROVED" || article.pendingStatus === "APPROVED";

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2.5">
      {isApproved && <PublishArticleButton article={article} />}
      <Link
        href={`/admin/articles/${article.id}`}
        className="rounded border border-rule bg-paper px-3 py-1 font-sans text-xs font-semibold text-ink hover:border-ink hover:bg-surface transition-colors"
      >
        Edit article
      </Link>
      <Link
        href={
          article.isPublished
            ? `/article/${article.slug}`
            : `/admin/preview/${article.id}`
        }
        target="_blank"
        className="rounded border border-rule px-3 py-1 font-sans text-xs font-semibold text-muted hover:text-ink hover:border-ink transition-colors"
      >
        {article.isPublished ? "View live ↗" : "Private preview ↗"}
      </Link>
      <DeleteArticleButton id={article.id} title={article.title} />
    </div>
  );
}

export function SocialPostActions({ post }: { post: any }) {
  const [body, setBody] = useState(post.body);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState(post.status);

  async function act(action: "approve" | "reject" | "send") {
    setBusy(action);
    setMessage("");
    try {
      const r = await fetch("/api/newsroom/social-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id, action, body }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error || "Action failed");
      setStatus(d.post.status);
      setMessage(
        action === "send"
          ? "Sent."
          : action === "approve"
            ? "Approved. Goes out on the next delivery run, or click Send now to post immediately."
            : "Rejected.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  const done = status !== "PENDING_APPROVAL" && status !== "APPROVED";

  return (
    <div className="space-y-3">
      <textarea
        className="border border-rule block w-full p-2 text-sm rounded bg-surface font-mono"
        rows={post.platform === "X" ? 3 : 6}
        value={body}
        disabled={done}
        onChange={(e) => setBody(e.target.value)}
      />
      <p className="text-xs text-muted">
        {status} · {body.length} characters
      </p>
      {!done && (
        <div className="flex flex-wrap gap-2">
          <button
            disabled={busy !== null}
            onClick={() => act("send")}
            className="rounded bg-ink text-paper px-3 py-1.5 text-xs font-semibold hover:bg-ink/90 transition-colors disabled:opacity-50"
          >
            {busy === "send" ? "Sending..." : "Send now"}
          </button>
          <button
            disabled={busy !== null}
            onClick={() => act("approve")}
            className="rounded border border-rule bg-paper px-3 py-1.5 text-xs font-semibold text-ink hover:border-ink transition-colors disabled:opacity-50"
          >
            {busy === "approve" ? "Saving..." : "Approve (queue for delivery)"}
          </button>
          <button
            disabled={busy !== null}
            onClick={() => act("reject")}
            className="rounded border border-accent/40 bg-surface px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent-soft hover:border-accent transition-colors disabled:opacity-50"
          >
            {busy === "reject" ? "..." : "Reject"}
          </button>
        </div>
      )}
      {message && <p role="status" className="text-xs text-accent">{message}</p>}
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

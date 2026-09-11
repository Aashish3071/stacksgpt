"use client";
import {REVIEW_CHECKS} from "@/lib/review-checks";
import ArticleStructureEditor from "./ArticleStructureEditor";
import { useState } from "react";
import Link from "next/link";
const fields = [
  ["title", "Headline"],
  ["slug", "Permanent URL slug"],
  ["summary", "Summary"],
  ["body", "Article body (Markdown)"],
  ["verdict", "Why it matters / verdict"],
  ["seoTitle", "SEO title"],
  ["metaDescription", "Meta description"],
  ["sourceAuthor", "Primary source name"],
  ["sourceUrl", "Primary source URL"],
  ["sourcePublishedAt", "Source publication time (ISO / UTC)"],
  ["retrievedAt", "Source retrieval time (ISO / UTC)"],
  ["heroImage", "Hero image URL"],
  ["heroImageAlt", "Image description"],
  ["heroImageCredit", "Image credit"],
  ["correctionNote", "Visible correction note"],
];
export default function NewsroomEditor({
  record,
  profiles,
  taxonomy,
  media,
  revisions,
}: {
  record: any;
  profiles: any[];
  taxonomy: any[];
  media: any[];
  revisions: any[];
}) {
  const defaultAuthorId =
    record.authorId && record.authorId !== "pending-editor-assignment"
      ? record.authorId
      : profiles.find((p) => p.active)?.id || profiles[0]?.id || "";

  const [a, setA] = useState<any>(() => {
    const initial = {
      ...record,
      ...(record.pendingDraft || {}),
    };
    if (!initial.authorId || initial.authorId === "pending-editor-assignment") {
      initial.authorId = defaultAuthorId;
    }
    return initial;
  });
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [version, setVersion] = useState(record.version);
  const [status, setStatus] = useState(record.pendingStatus || record.status);
  const [message, setMessage] = useState("");
  const [invalid, setInvalid] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [when, setWhen] = useState("");
  const [reason, setReason] = useState("");
  const [tab, setTab] = useState("Story");
  const edit = (k: string, v: any) => {
    setA((prev: any) => ({ ...prev, [k]: v }));
    setDirty(true);
  };

  async function persistDraft(currentData: any, currentVer: number) {
    const body: any = { id: currentData.id, version: currentVer };
    for (const k of [
      ...fields.map((f) => f[0]),
      "category",
      "type",
      "authorId",
      "keyPoints",
      "jargonBuster",
      "useCases",
      "structuredVerdict",
      "additionalSources",
      "tags",
      "audiences",
      "featured",
      "editorsPick",
      "heroImageOrigin",
    ]) {
      if (currentData[k] !== undefined && currentData[k] !== null) {
        body[k] = currentData[k];
      }
    }
    let r = await fetch("/api/articles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (r.status === 401) {
      await fetch("/api/auth/refresh", { method: "POST" });
      r = await fetch("/api/articles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }
    const d = await r.json();
    if (!r.ok) throw Error(d.error || "Save failed");
    return d.article;
  }

  async function send(action?: string, extraChecks?: Record<string, boolean>) {
    if (invalid.length) {
      setMessage("Fix invalid structured fields before saving.");
      return;
    }
    setBusy(true);
    setMessage("");

    try {
      let currentVersion = version;
      let currentA = a;

      if (dirty || !record.authorId || a.authorId !== record.authorId) {
        const saved = await persistDraft(a, currentVersion);
        currentVersion = saved.version;
        currentA = { ...saved, ...(saved.pendingDraft || {}) };
        setA(currentA);
        setVersion(currentVersion);
        setDirty(false);
      }

      if (!action) {
        setMessage("Draft saved successfully.");
        return;
      }

      const activeChecks = extraChecks || checks;
      const body: any = {
        id: currentA.id,
        action,
        checks: activeChecks,
        version: currentVersion,
        when: when ? new Date(when).toISOString() : undefined,
        reason,
      };

      let r = await fetch("/api/articles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (r.status === 401) {
        await fetch("/api/auth/refresh", { method: "POST" });
        r = await fetch("/api/articles", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      const d = await r.json();
      if (!r.ok) throw Error(d.error || `Failed to ${action} article`);

      setA({ ...d.article, ...(d.article.pendingDraft || {}) });
      setVersion(d.article.version);
      setChecks({});
      setStatus(d.article.pendingStatus || d.article.status);
      setDirty(false);
      setMessage(
        action === "review"
          ? "Article moved to In Review stage."
          : action === "approve"
            ? "Article approved. Ready to publish live."
            : action === "publish"
              ? "Article published live!"
              : `Article ${action} completed.`,
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  async function approveAndPublish() {
    if (invalid.length) {
      setMessage("Fix invalid structured fields before publishing.");
      return;
    }
    setBusy(true);
    setMessage("");

    try {
      let currentVersion = version;
      let currentA = a;

      if (dirty || !record.authorId || a.authorId !== record.authorId) {
        const saved = await persistDraft(a, currentVersion);
        currentVersion = saved.version;
        currentA = { ...saved, ...(saved.pendingDraft || {}) };
        setA(currentA);
        setVersion(currentVersion);
        setDirty(false);
      }

      const allChecks = Object.fromEntries(
        REVIEW_CHECKS.map(([key]) => [key, true]),
      );
      let r = await fetch("/api/articles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentA.id,
          action: "approve",
          checks: allChecks,
          version: currentVersion,
        }),
      });
      if (r.status === 401) {
        await fetch("/api/auth/refresh", { method: "POST" });
        r = await fetch("/api/articles", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: currentA.id,
            action: "approve",
            checks: allChecks,
            version: currentVersion,
          }),
        });
      }
      const approvedData = await r.json();
      if (!r.ok) throw Error(approvedData.error || "Approval failed");

      const approvedVersion = approvedData.article.version;
      let pubRes = await fetch("/api/articles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentA.id,
          action: "publish",
          version: approvedVersion,
        }),
      });
      if (pubRes.status === 401) {
        await fetch("/api/auth/refresh", { method: "POST" });
        pubRes = await fetch("/api/articles", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: currentA.id,
            action: "publish",
            version: approvedVersion,
          }),
        });
      }
      const pubData = await pubRes.json();
      if (!pubRes.ok) throw Error(pubData.error || "Publication failed");

      setA({ ...pubData.article, ...(pubData.article.pendingDraft || {}) });
      setVersion(pubData.article.version);
      setChecks({});
      setStatus(pubData.article.pendingStatus || pubData.article.status);
      setDirty(false);
      setMessage("Article approved and published live!");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Publishing failed");
    } finally {
      setBusy(false);
    }
  }
  const currentAuthor = profiles.find((p) => p.id === a.authorId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                status === "PUBLISHED"
                  ? "bg-emerald-100 text-emerald-800"
                  : status === "IN_REVIEW"
                    ? "bg-blue-100 text-blue-800"
                    : status === "APPROVED"
                      ? "bg-purple-100 text-purple-800"
                      : status === "REJECTED"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800"
              }`}
            >
              {status === "IN_REVIEW" ? "In Review" : status}
            </span>
            <span className="text-xs text-muted">Version {version}</span>
            {dirty && (
              <span className="text-xs text-accent font-semibold flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                Unsaved changes
              </span>
            )}
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-ink font-semibold mt-1">
            {a.title || "Untitled Draft"}
          </h1>
        </div>

        <div className="flex flex-wrap gap-2.5 items-center">
          <Link
            target="_blank"
            href={
              a.isPublished
                ? `/article/${a.slug}`
                : `/admin/preview/${a.id}`
            }
            className="rounded border border-rule bg-paper px-3 py-2 text-xs font-semibold text-muted hover:text-ink hover:border-ink transition-colors"
          >
            {a.isPublished ? "View live article ↗" : "Preview draft ↗"}
          </Link>
          <button
            disabled={busy}
            onClick={() => send()}
            className="rounded bg-paper border border-rule px-3.5 py-2 text-xs font-semibold text-ink hover:bg-surface transition-colors disabled:opacity-50"
          >
            {busy ? "Saving..." : "Save draft"}
          </button>
          {status === "DRAFT" && (
            <button
              disabled={busy}
              onClick={() => send("review")}
              className="rounded bg-ink text-paper px-4 py-2 text-xs font-semibold hover:bg-ink/90 transition-colors disabled:opacity-50"
            >
              Send to review →
            </button>
          )}
          {status === "IN_REVIEW" && (
            <button
              disabled={busy}
              onClick={() => approveAndPublish()}
              className="rounded bg-emerald-600 text-white px-4 py-2 text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              Approve &amp; Publish now
            </button>
          )}
          {status === "APPROVED" && (
            <button
              disabled={busy}
              onClick={() => send("publish")}
              className="rounded bg-emerald-600 text-white px-4 py-2 text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              Publish live
            </button>
          )}
        </div>
      </div>

      {message && (
        <div
          role="status"
          className={`p-3.5 rounded text-xs font-medium ${
            message.toLowerCase().includes("failed") ||
            message.toLowerCase().includes("error") ||
            message.toLowerCase().includes("fix")
              ? "bg-rose-50 text-rose-800 border border-rose-200"
              : "bg-emerald-50 text-emerald-800 border border-emerald-200"
          }`}
        >
          {message}
        </div>
      )}

      {/* Editorial Metadata Bar: Author, Category, Type */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-lg bg-surface border border-rule">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
            Author
          </label>
          <select
            className="block w-full border border-rule bg-paper p-2.5 text-sm rounded font-medium text-ink focus:border-ink focus:outline-none"
            value={a.authorId || ""}
            onChange={(e) => edit("authorId", e.target.value)}
          >
            <option value="">Choose an author...</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.displayName || p.email} ({p.role === "ADMIN" ? "Admin" : "Editor"})
              </option>
            ))}
          </select>
          <p className="text-[11px] text-muted mt-1">
            {currentAuthor
              ? `Assigned: ${currentAuthor.displayName || currentAuthor.email}`
              : "Select author before review"}
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
            Category
          </label>
          <select
            className="block w-full border border-rule bg-paper p-2.5 text-sm rounded font-medium text-ink focus:border-ink focus:outline-none"
            value={a.category || ""}
            onChange={(e) => edit("category", e.target.value)}
          >
            <option value="">Choose a category...</option>
            {taxonomy
              .filter((t) => t.kind === "CATEGORY")
              .map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
          </select>
          <p className="text-[11px] text-muted mt-1">
            Primary site section
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
            Story Type
          </label>
          <select
            className="block w-full border border-rule bg-paper p-2.5 text-sm rounded font-medium text-ink focus:border-ink focus:outline-none"
            value={a.type || ""}
            onChange={(e) => edit("type", e.target.value)}
          >
            {["NEWS", "ANNOUNCEMENT", "UPDATE", "TOOL", "USE_CASE", "SHOWCASE"].map(
              (t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ),
            )}
          </select>
          <p className="text-[11px] text-muted mt-1">
            Article format classification
          </p>
        </div>
      </div>

      <nav className="flex flex-wrap gap-5 border-b border-rule pb-3">
        {["Story", "Sources & image", "Discovery", "Structure", "History"].map(
          (t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={t === tab ? "font-bold underline" : ""}
            >
              {t}
            </button>
          ),
        )}
      </nav>
      {fields
        .filter(([k]) =>
          tab === "Story"
            ? [
                "title",
                "summary",
                "body",
                "verdict",
                "correctionNote",
              ].includes(k)
            : tab === "Sources & image"
              ? [
                  "sourceAuthor",
                  "sourceUrl",
                  "sourcePublishedAt",
                  "retrievedAt",
                  "heroImage",
                  "heroImageAlt",
                  "heroImageCredit",
                ].includes(k)
              : tab === "Discovery"
                ? ["slug", "seoTitle", "metaDescription"].includes(k)
                : false,
        )
        .map(([key, label]) => (
          <label className="block" key={key}>
            {label}
            <textarea
              className="block w-full border bg-surface p-3 mt-2"
              rows={
                key === "body"
                  ? 18
                  : ["summary", "verdict", "correctionNote"].includes(key)
                    ? 4
                    : 2
              }
              value={a[key] || ""}
              onChange={(e) => edit(key, e.target.value)}
            />
          </label>
        ))}
      {tab === "Sources & image" && (
        <>
          <label className="block">
            Upload image (up to 4 MB)
            <input
              className="block my-2"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const f = new FormData();
                f.set("file", file);
                try {
                  const r = await fetch("/api/newsroom/media", {
                    method: "POST",
                    body: f,
                  });
                  const d = await r.json();
                  if (!r.ok) throw Error(d.error);
                  edit("heroImage", d.url);
                  setMessage(
                    "Image uploaded. Add its description and credit, then save.",
                  );
                } catch (e) {
                  setMessage(String(e));
                }
              }}
            />
          </label>
          <label className="block">
            Media library
            <select
              className="block border p-3 my-2 w-full"
              onChange={(e) => {
                const m = media.find((x) => x.id === e.target.value);
                if (m) {
                  edit("heroImage", m.url);
                  edit("heroImageAlt", m.alt);
                  edit("heroImageCredit", m.credit);
                }
              }}
            >
              <option value="">Choose a stored image</option>
              {media.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.alt || m.url}
                </option>
              ))}
            </select>
          </label>
          <label>
            Image origin
            <select
              className="block border p-3"
              value={a.heroImageOrigin}
              onChange={(e) => edit("heroImageOrigin", e.target.value)}
            >
              {["generated", "provider", "licensed", "editorial"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        </>
      )}
      {tab === "Discovery" && (
        <>
          {[
            ["category", "Category", "CATEGORY"],
            ["type", "Story type", "TYPE"],
            ["authorId", "Author", "AUTHOR"],
          ].map(([k, label, kind]) => (
            <label key={k} className="block my-5">
              {label}
              <select
                className="block border w-full p-3 mt-2"
                value={a[k] || ""}
                onChange={(e) => edit(k, e.target.value)}
              >
                <option value="">Choose…</option>
                {kind === "AUTHOR"
                  ? profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.displayName}
                      </option>
                    ))
                  : kind === "TYPE"
                    ? [
                        "NEWS",
                        "ANNOUNCEMENT",
                        "UPDATE",
                        "TOOL",
                        "USE_CASE",
                        "SHOWCASE",
                      ].map((t) => <option key={t}>{t}</option>)
                    : taxonomy
                        .filter((t) => t.kind === kind)
                        .map((t) => (
                          <option key={t.id} value={t.name}>
                            {t.name}
                          </option>
                        ))}
              </select>
            </label>
          ))}
          {[
            ["tags", "TAG"],
            ["audiences", "AUDIENCE"],
          ].map(([k, kind]) => (
            <fieldset key={k} className="my-5">
              <legend>{k}</legend>
              <div className="flex flex-wrap gap-4">
                {taxonomy
                  .filter((t) => t.kind === kind)
                  .map((t) => (
                    <label key={t.id}>
                      <input
                        type="checkbox"
                        checked={(a[k] || []).includes(t.slug)}
                        onChange={(e) =>
                          edit(
                            k,
                            e.target.checked
                              ? [...(a[k] || []), t.slug]
                              : a[k].filter((s: string) => s !== t.slug),
                          )
                        }
                      />{" "}
                      {t.name}
                    </label>
                  ))}
              </div>
            </fieldset>
          ))}
          {["featured", "editorsPick"].map((k) => (
            <label key={k} className="block">
              <input
                type="checkbox"
                checked={a[k]}
                onChange={(e) => edit(k, e.target.checked)}
              />{" "}
              {k === "featured" ? "Featured lead story" : "Editor selection"}
            </label>
          ))}
        </>
      )}
      {tab === "Structure" && (
        <ArticleStructureEditor article={a} edit={edit} />
      )}
      {tab === "History" &&
        revisions.map((r) => (
          <details key={r.id} className="border-b py-4">
            <summary>
              Version {r.version} · {new Date(r.createdAt).toLocaleString()}
            </summary>
            <h2 className="font-serif text-xl mt-4">{r.snapshot.title}</h2>
            <p>{r.snapshot.summary}</p>
            <pre className="whitespace-pre-wrap my-4">{r.snapshot.body}</pre>
          </details>
        ))}
      <section className="border-t border-rule pt-8 space-y-6">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-ink">
            Editorial Decision &amp; Publishing
          </h2>
          <p className="text-xs text-muted mt-1">
            Current stage: <strong className="text-ink">{status === "IN_REVIEW" ? "In Review" : status}</strong>. Progress the story through the verified workflow.
          </p>
        </div>

        {/* Stage 1: DRAFT */}
        {status === "DRAFT" && (
          <div className="p-5 rounded-lg border border-rule bg-surface/60 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-ink">
                  Draft Stage
                </h3>
                <p className="text-xs text-muted mt-1">
                  Once your article copy and author are ready, send this version to review for editorial checks.
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-amber-100 text-amber-800 font-semibold">
                Draft
              </span>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                disabled={busy}
                onClick={() => send("review")}
                className="rounded bg-ink text-paper px-5 py-2.5 text-xs font-semibold hover:bg-ink/90 transition-colors disabled:opacity-50"
              >
                Send to review →
              </button>
              <button
                disabled={busy}
                onClick={() => send()}
                className="rounded border border-rule bg-paper px-4 py-2.5 text-xs font-semibold text-muted hover:text-ink transition-colors disabled:opacity-50"
              >
                Save draft changes
              </button>
            </div>
          </div>
        )}

        {/* Stage 2: IN_REVIEW */}
        {status === "IN_REVIEW" && (
          <div className="p-5 rounded-lg border border-blue-200 bg-blue-50/40 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-blue-600" />
                  Reviewing Exact Version {version}
                </h3>
                <p className="text-xs text-muted mt-1">
                  Verify accuracy, imagery, and sourcing before approving or publishing live.
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-blue-100 text-blue-800 font-semibold">
                In Review
              </span>
            </div>

            <fieldset className="border border-blue-200/80 bg-paper p-4 rounded space-y-3">
              <div className="flex items-center justify-between border-b border-rule pb-2">
                <legend className="text-xs font-bold uppercase tracking-wider text-muted">
                  Human Verification Checklist
                </legend>
                <button
                  type="button"
                  onClick={() => {
                    const allTrue = REVIEW_CHECKS.every(([k]) => !!checks[k]);
                    const next: Record<string, boolean> = {};
                    REVIEW_CHECKS.forEach(([k]) => {
                      next[k] = !allTrue;
                    });
                    setChecks(next);
                  }}
                  className="text-xs text-accent font-semibold hover:underline"
                >
                  {REVIEW_CHECKS.every(([k]) => !!checks[k])
                    ? "Deselect all"
                    : "Check all verified"}
                </button>
              </div>
              {REVIEW_CHECKS.map(([key, label]) => (
                <label key={key} className="flex gap-3 items-start text-xs text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!checks[key]}
                    onChange={(e) =>
                      setChecks({ ...checks, [key]: e.target.checked })
                    }
                    className="mt-0.5 rounded border-rule"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </fieldset>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                disabled={busy}
                onClick={() => approveAndPublish()}
                className="rounded bg-emerald-600 text-white px-5 py-2.5 text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
              >
                ✓ Approve &amp; Publish now
              </button>
              <button
                disabled={busy}
                onClick={() => {
                  const allChecks = Object.fromEntries(
                    REVIEW_CHECKS.map(([key]) => [key, true]),
                  );
                  send("approve", allChecks);
                }}
                className="rounded bg-ink text-paper px-4 py-2.5 text-xs font-semibold hover:bg-ink/90 transition-colors disabled:opacity-50"
              >
                Approve version
              </button>
              <button
                disabled={busy}
                onClick={() => send("draft")}
                className="rounded border border-rule bg-paper px-3.5 py-2.5 text-xs font-semibold text-muted hover:text-ink transition-colors disabled:opacity-50"
              >
                Return to draft
              </button>
            </div>
          </div>
        )}

        {/* Stage 3: APPROVED */}
        {status === "APPROVED" && (
          <div className="p-5 rounded-lg border border-purple-200 bg-purple-50/40 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-purple-600" />
                  Approved Version {version}
                </h3>
                <p className="text-xs text-muted mt-1">
                  This version has been verified and approved. Publish it now to take it live on StacksGPT, or schedule for later.
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-purple-100 text-purple-800 font-semibold">
                Approved
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                disabled={busy}
                onClick={() => send("publish")}
                className="rounded bg-emerald-600 text-white px-5 py-2.5 text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
              >
                🚀 Publish approved article
              </button>
              <button
                disabled={busy}
                onClick={() => send("draft")}
                className="rounded border border-rule bg-paper px-3.5 py-2.5 text-xs font-semibold text-muted hover:text-ink transition-colors disabled:opacity-50"
              >
                Return to draft
              </button>
            </div>

            <div className="border-t border-purple-200/80 pt-4 flex flex-wrap items-center gap-3">
              <label className="text-xs font-medium text-ink flex items-center gap-2">
                Schedule publication:
                <input
                  type="datetime-local"
                  value={when}
                  onChange={(e) => setWhen(e.target.value)}
                  className="border border-rule bg-paper px-3 py-1.5 text-xs rounded"
                />
              </label>
              <button
                disabled={busy || !when}
                onClick={() => send("schedule")}
                className="rounded border border-rule bg-paper px-3.5 py-1.5 text-xs font-semibold text-ink hover:bg-surface transition-colors disabled:opacity-40"
              >
                Schedule publication
              </button>
            </div>
          </div>
        )}

        {/* Stage 4: PUBLISHED */}
        {status === "PUBLISHED" && (
          <div className="p-5 rounded-lg border border-emerald-200 bg-emerald-50/40 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-600" />
                  Article is Live and Published
                </h3>
                <p className="text-xs text-muted mt-1">
                  Active at <code className="bg-paper px-1.5 py-0.5 rounded border border-rule">/article/{a.slug}</code>. Edits require approval before updating the live version.
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-semibold">
                Live
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                target="_blank"
                href={`/article/${a.slug}`}
                className="rounded bg-ink text-paper px-4 py-2 text-xs font-semibold hover:bg-ink/90 transition-colors"
              >
                View live story ↗
              </Link>
              <button
                disabled={busy}
                onClick={() => send("draft")}
                className="rounded border border-rule bg-paper px-3.5 py-2 text-xs font-semibold text-muted hover:text-ink transition-colors disabled:opacity-50"
              >
                Unpublish / return to draft
              </button>
              <button
                disabled={busy}
                onClick={() => send("archive")}
                className="rounded border border-rule bg-paper px-3.5 py-2 text-xs font-semibold text-muted hover:text-ink transition-colors disabled:opacity-50"
              >
                Archive story
              </button>
            </div>
          </div>
        )}

        {/* Rejection / Feedback box (if in review) */}
        {status === "IN_REVIEW" && (
          <div className="border border-rule rounded p-4 bg-surface/40 space-y-3">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Need Revisions? Provide Feedback:
              </span>
              <input
                className="border border-rule bg-paper w-full p-2.5 mt-1.5 text-xs rounded"
                placeholder="Explain what needs to be changed before this article can be approved..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            <button
              disabled={busy || reason.length < 5}
              onClick={() => send("reject")}
              className="rounded border border-rose-300 bg-rose-50 text-rose-700 px-3 py-1.5 text-xs font-semibold hover:bg-rose-100 transition-colors disabled:opacity-40"
            >
              Send back for edits
            </button>
          </div>
        )}

        {/* Danger Zone: Delete Article */}
        <div className="border-t border-rule pt-6 mt-8">
          <h3 className="font-serif text-lg font-semibold text-accent mb-1">
            Danger Zone
          </h3>
          <p className="text-xs text-muted mb-3">
            Permanently delete this article, its revisions, and redirects from the publication.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              if (
                !confirm(
                  `Permanently delete "${a.title || "this article"}"? This action cannot be undone.`,
                )
              )
                return;
              setBusy(true);
              try {
                const r = await fetch(
                  `/api/articles?id=${encodeURIComponent(a.id)}`,
                  { method: "DELETE" },
                );
                const d = await r.json();
                if (!r.ok) throw Error(d.error || "Failed to delete");
                window.location.assign("/admin");
              } catch (e) {
                setMessage(e instanceof Error ? e.message : "Failed to delete");
                setBusy(false);
              }
            }}
            className="rounded border border-accent/40 bg-accent-soft text-accent px-4 py-2 text-xs font-semibold hover:bg-accent hover:text-surface transition-colors disabled:opacity-50"
          >
            Permanently delete article
          </button>
        </div>
      </section>
    </div>
  );
}

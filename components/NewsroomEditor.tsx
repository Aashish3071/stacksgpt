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
  const [a, setA] = useState<any>({
    ...record,
    ...(record.pendingDraft || {}),
  });
  const [checks,setChecks]=useState<Record<string,boolean>>({});
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
    setA((a: any) => ({ ...a, [k]: v }));
    setDirty(true);
  };
  async function send(action?: string) {
    if (invalid.length) {
      setMessage("Fix invalid structured fields before saving.");
      return;
    }
    if (action && dirty) {
      setMessage("Save changes before requesting a decision.");
      return;
    }
    setBusy(true);
    setMessage("");
    const body: any = action
      ? {
          id: a.id,
          action,
          checks,
          version,
          when: when ? new Date(when).toISOString() : undefined,
          reason,
        }
      : { id: a.id, version };
    if (!action) {
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
      ])
        if (a[k] !== undefined && a[k] !== null) body[k] = a[k];
    }
    try {
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
      if (!r.ok) throw Error(d.error);
      setA({ ...d.article, ...(d.article.pendingDraft || {}) });
      setVersion(d.article.version);
      setChecks({});
      setStatus(d.article.pendingStatus || d.article.status);
      setDirty(false);
      setMessage(
        action
          ? `Article ${action} completed.`
          : "Draft saved. Publication requires fresh review and approval.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">{a.title}</h1>
          <p className="mt-2">
            {status} · Version {version}
            {dirty ? " · Unsaved changes" : ""}
          </p>
        </div>
        <div className="flex gap-2.5 items-center">
          <Link
            target="_blank"
            href={`/admin/preview/${a.id}`}
            className="rounded border border-rule px-3 py-2 text-xs font-semibold text-muted hover:text-ink hover:border-ink transition-colors"
          >
            Preview draft ↗
          </Link>
          <button
            disabled={busy}
            onClick={() => send()}
            className="rounded bg-ink text-paper px-4 py-2 text-xs font-semibold hover:bg-ink/90 transition-colors disabled:opacity-50"
          >
            {busy ? "Saving..." : "Save changes"}
          </button>
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
            className="rounded border border-accent/40 bg-accent-soft text-accent px-3 py-2 text-xs font-semibold hover:bg-accent hover:text-surface transition-colors disabled:opacity-50"
          >
            Delete article
          </button>
        </div>
      </div>
      <p role="status" className="whitespace-pre-wrap text-accent">
        {message}
      </p>
      <nav className="flex flex-wrap gap-5 border-b pb-3">
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
            ["category", "CATEGORY"],
            ["type", "TYPE"],
            ["authorId", "AUTHOR"],
          ].map(([k, kind]) => (
            <label key={k} className="block my-5">
              {k}
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
      <section className="border-t pt-6 space-y-4">
        <h2 className="font-serif text-2xl">Editorial decision</h2>{status==="IN_REVIEW"&&<fieldset className="border p-4 space-y-3"><legend>Review this exact version</legend>{REVIEW_CHECKS.map(([key,label])=><label key={key} className="flex gap-3 items-start"><input type="checkbox" checked={!!checks[key]} onChange={e=>setChecks({...checks,[key]:e.target.checked})} className="mt-1"/><span>{label}</span></label>)}</fieldset>}
        <div className="flex flex-wrap gap-3">
          {[
            ["review", "Send to review"],
            ["approve", "Approve reviewed version"],
            ["publish", "Publish approved version"],
            ["draft", "Unpublish / return to draft"],
            ["archive", "Archive"],
          ].map(([action, label]) => (
            <button
              key={action}
              disabled={
                busy ||
                (action === "approve" && (status !== "IN_REVIEW"||REVIEW_CHECKS.some(([key])=>!checks[key]))) ||
                (action === "publish" && status !== "APPROVED")
              }
              onClick={() => send(action)}
              className="border px-4 py-2 disabled:opacity-40"
            >
              {label}
            </button>
          ))}
        </div>
        <label>
          Schedule (your local time)
          <input
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className="border mx-3 p-2"
          />
        </label>
        <button
          disabled={busy || status !== "APPROVED" || !when}
          onClick={() => send("schedule")}
          className="border p-2 disabled:opacity-40"
        >
          Schedule
        </button>
        <div>
          <label>
            Rejection reason
            <input
              className="border p-2 mx-3"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <button
            disabled={busy || reason.length < 5}
            onClick={() => send("reject")}
            className="border p-2 text-xs"
          >
            Reject
          </button>
        </div>

        <div className="border-t border-rule pt-6 mt-6">
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

"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Tab = "review" | "leads" | "published" | "channels" | "tools";

interface RawNews {
  title: string | null;
  rawText: string;
  externalUrl: string;
  author: string;
  score: number;
}

interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string;
  verdict: string;
  category: string;
  status: string;
  viewCount: number;
  seoTitle: string | null;
  metaDescription: string | null;
  keywords: string | null;
  heroImage: string | null;
  publishedAt: string | null;
  origin: string;
  sourceAuthor: string | null;
  sourceUrl: string | null;
  primaryTool?: { name: string; slug: string; status: string } | null;
  rawNews?: RawNews | null;
}

interface Channel {
  id: string;
  name: string;
  handleOrUrl: string;
  type: string;
  category: string;
  isActive: boolean;
  lastFetchedAt: string | null;
}

interface Tool {
  id: string;
  name: string;
  slug: string;
  category: string;
  websiteUrl: string;
  affiliateUrl: string | null;
  status: string;
  clicksCount: number;
}

interface Lead {
  id: string;
  title: string | null;
  externalUrl: string;
  author: string;
  score: number;
  publishedAt: string | null;
  channel: { name: string; category: string };
}

const TAB_LABELS: Record<Tab, string> = {
  review: "Review queue",
  leads: "Story leads",
  published: "Published",
  channels: "Sources",
  tools: "Tools",
};

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("review");
  const [articles, setArticles] = useState<Article[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, c, t, l] = await Promise.all([
        fetch("/api/articles").then((r) => r.json()),
        fetch("/api/channels").then((r) => r.json()),
        fetch("/api/tools").then((r) => r.json()),
        fetch("/api/leads").then((r) => r.json()),
      ]);
      setArticles(a.articles || []);
      setChannels(c.channels || []);
      setTools(t.tools || []);
      setLeads(l.leads || []);
    } catch {
      setNotice("Could not load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const queue = articles.filter((a) => a.status === "DRAFT" || a.status === "NEEDS_EDIT");
  const published = articles.filter((a) => a.status === "PUBLISHED");

  return (
    <div className="mx-auto max-w-shell px-4 py-10 sm:px-6">
      <div className="flex items-baseline justify-between border-b border-rule pb-4">
        <h1 className="font-serif text-head-md font-semibold text-ink">Editor</h1>
        <div className="flex items-center gap-4">
          {loading && <span className="meta">Loading…</span>}
          <button onClick={load} className="meta hover:text-accent">
            Refresh
          </button>
          <button
            onClick={async () => {
              await fetch("/api/admin/login", { method: "DELETE" });
              window.location.href = "/admin/login";
            }}
            className="meta hover:text-accent"
          >
            Sign out
          </button>
        </div>
      </div>

      <nav className="flex gap-4 border-b border-rule py-3">
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`font-sans text-meta font-medium ${
              tab === t ? "text-accent" : "text-muted hover:text-ink"
            }`}
          >
            {TAB_LABELS[t]}
            {t === "review" && queue.length > 0 && ` (${queue.length})`}
            {t === "leads" && leads.length > 0 && ` (${leads.length})`}
          </button>
        ))}
      </nav>

      {notice && <p className="mt-4 font-sans text-meta text-accent">{notice}</p>}

      {tab === "review" && <ReviewQueue items={queue} onDone={load} setNotice={setNotice} />}
      {tab === "leads" && <Leads items={leads} onDone={load} />}
      {tab === "published" && <PublishedList items={published} onDone={load} />}
      {tab === "channels" && <Channels items={channels} onDone={load} />}
      {tab === "tools" && <Tools items={tools} onDone={load} setNotice={setNotice} />}
    </div>
  );
}

/* ---------------------------------------------------------------- Review */

function ReviewQueue({
  items,
  onDone,
  setNotice,
}: {
  items: Article[];
  onDone: () => void;
  setNotice: (s: string) => void;
}) {
  if (items.length === 0) {
    return (
      <p className="meta py-16 text-center">
        Nothing waiting. Run the ingestion job to draft new stories.
      </p>
    );
  }

  return (
    <div className="divide-y divide-rule">
      {items.map((article) => (
        <ReviewItem key={article.id} article={article} onDone={onDone} setNotice={setNotice} />
      ))}
    </div>
  );
}

function ReviewItem({
  article,
  onDone,
  setNotice,
}: {
  article: Article;
  onDone: () => void;
  setNotice: (s: string) => void;
}) {
  const [title, setTitle] = useState(article.title);
  const [summary, setSummary] = useState(article.summary);
  const [verdict, setVerdict] = useState(article.verdict);
  const [busy, setBusy] = useState(false);

  const dirty =
    title !== article.title || summary !== article.summary || verdict !== article.verdict;

  const act = async (status?: string) => {
    setBusy(true);
    setNotice("");
    try {
      const res = await fetch("/api/articles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: article.id, title, summary, verdict, status }),
      });
      const data = await res.json();
      if (!res.ok) setNotice(data.error || "Update failed.");
      else onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="grid gap-6 py-8 lg:grid-cols-2">
      {/* Source */}
      <div className="lg:border-r lg:border-rule lg:pr-6">
        <div className="flex items-center gap-2">
          <span className="kicker-muted">Source</span>
          {article.status === "NEEDS_EDIT" && (
            <span className="kicker text-accent">Fallback draft — rewrite before publishing</span>
          )}
        </div>

        <p className="meta mt-2">
          {article.sourceAuthor}
          {article.rawNews && ` · relevance ${article.rawNews.score}`}
        </p>

        {article.rawNews?.title && (
          <p className="mt-2 font-serif text-head-sm text-ink">{article.rawNews.title}</p>
        )}

        <p className="mt-2 max-h-48 overflow-y-auto font-sans text-meta leading-relaxed text-muted">
          {article.rawNews?.rawText || "(original text not stored)"}
        </p>

        {article.sourceUrl && (
          <a
            href={article.sourceUrl}
            target="_blank"
            rel="noreferrer nofollow"
            className="meta mt-3 inline-block text-accent underline"
          >
            Open original ↗
          </a>
        )}
      </div>

      {/* Draft */}
      <div>
        <span className="kicker-muted">Draft</span>

        <label className="meta mt-3 block">Headline</label>
        <textarea
          rows={2}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full border border-rule-strong bg-surface px-2.5 py-2 font-serif text-head-sm text-ink focus:border-ink focus:outline-none"
        />

        <label className="meta mt-3 block">Summary</label>
        <textarea
          rows={3}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="mt-1 w-full border border-rule-strong bg-surface px-2.5 py-2 font-sans text-meta text-ink focus:border-ink focus:outline-none"
        />

        <label className="meta mt-3 block">Verdict</label>
        <textarea
          rows={3}
          value={verdict}
          onChange={(e) => setVerdict(e.target.value)}
          className="mt-1 w-full border border-rule-strong bg-surface px-2.5 py-2 font-sans text-meta text-ink focus:border-ink focus:outline-none"
        />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            disabled={busy}
            onClick={() => act("PUBLISHED")}
            className="border border-ink bg-ink px-4 py-2 font-sans text-meta font-medium text-paper hover:border-accent hover:bg-accent disabled:opacity-60"
          >
            Approve &amp; publish
          </button>
          <button
            disabled={busy || !dirty}
            onClick={() => act()}
            className="border border-rule-strong px-4 py-2 font-sans text-meta text-muted hover:text-ink disabled:opacity-40"
          >
            Save edits
          </button>
          <button
            disabled={busy}
            onClick={() => act("REJECTED")}
            className="meta text-muted hover:text-accent disabled:opacity-60"
          >
            Reject
          </button>
          <Link href={`/article/${article.slug}`} target="_blank" className="meta hover:text-accent">
            Preview ↗
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ----------------------------------------------------------------- Leads */

function Leads({ items, onDone }: { items: Lead[]; onDone: () => void }) {
  const dismiss = async (id: string) => {
    await fetch("/api/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    onDone();
  };

  if (items.length === 0) {
    return <p className="meta py-16 text-center">No leads. Run the ingestion job to collect some.</p>;
  }

  return (
    <div className="py-6">
      <p className="meta max-w-measure-wide leading-relaxed">
        Candidate stories collected from your sources and ranked for how useful they are likely to
        be to a non-technical reader. Copy a URL and hand it to your writing agent; dismiss the
        ones you do not want to cover.
      </p>

      <div className="mt-6 divide-y divide-rule">
        {items.map((lead) => (
          <div key={lead.id} className="flex items-baseline justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="font-sans text-meta font-medium text-ink">{lead.title}</p>
              <p className="meta truncate">
                {lead.channel.name} · score {lead.score} ·{" "}
                <a
                  href={lead.externalUrl}
                  target="_blank"
                  rel="noreferrer nofollow"
                  className="text-accent underline"
                >
                  {lead.externalUrl}
                </a>
              </p>
            </div>
            <div className="flex shrink-0 gap-3">
              <button
                onClick={() => navigator.clipboard?.writeText(lead.externalUrl)}
                className="meta hover:text-accent"
              >
                Copy URL
              </button>
              <button onClick={() => dismiss(lead.id)} className="meta hover:text-accent">
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- Published */

function PublishedList({ items, onDone }: { items: Article[]; onDone: () => void }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"recent" | "views" | "title">("recent");
  const [expanded, setExpanded] = useState<string | null>(null);

  const unpublish = async (id: string) => {
    await fetch("/api/articles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "DRAFT" }),
    });
    onDone();
  };

  if (items.length === 0) return <p className="meta py-16 text-center">Nothing published yet.</p>;

  const filtered = items
    .filter((a) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.slug.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sort === "views") return b.viewCount - a.viewCount;
      if (sort === "title") return a.title.localeCompare(b.title);
      return (b.publishedAt || "").localeCompare(a.publishedAt || "");
    });

  const totalViews = items.reduce((n, a) => n + a.viewCount, 0);
  const missingSeo = items.filter((a) => !a.seoTitle || !a.metaDescription).length;
  const missingImage = items.filter((a) => !a.heroImage).length;

  return (
    <div className="py-6">
      {/* At-a-glance health of everything live. */}
      <div className="grid grid-cols-2 gap-px border border-rule bg-rule sm:grid-cols-4">
        {[
          ["Published", String(items.length)],
          ["Total views", String(totalViews)],
          ["Missing SEO", String(missingSeo)],
          ["No image", String(missingImage)],
        ].map(([label, value]) => (
          <div key={label} className="bg-surface px-4 py-3">
            <p className="kicker-muted">{label}</p>
            <p className="mt-1 font-serif text-head-sm text-ink">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search headline, slug or category"
          className="min-w-56 flex-1 border border-rule-strong bg-surface px-3 py-2 font-sans text-meta focus:border-ink focus:outline-none"
        />
        <div className="flex gap-3">
          {(["recent", "views", "title"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`font-sans text-meta ${
                sort === s ? "font-medium text-accent" : "text-muted hover:text-ink"
              }`}
            >
              {s === "recent" ? "Newest" : s === "views" ? "Most read" : "A–Z"}
            </button>
          ))}
        </div>
      </div>

      <p className="meta mt-3">
        {filtered.length} of {items.length} shown
      </p>

      <div className="mt-2 divide-y divide-rule border-t border-rule">
        {filtered.map((a) => {
          const seoOk = Boolean(a.seoTitle && a.metaDescription);
          const isOpen = expanded === a.id;
          return (
            <div key={a.id} className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="meta">
                    {a.category}
                    <span aria-hidden> · </span>
                    {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString("en-GB") : "—"}
                    <span aria-hidden> · </span>
                    {a.viewCount} views
                    <span aria-hidden> · </span>
                    {a.origin}
                  </p>

                  <p className="mt-1 font-serif text-head-sm text-ink">
                    <Link href={`/article/${a.slug}`} target="_blank" className="hover:text-accent">
                      {a.title}
                    </Link>
                  </p>

                  <p className="meta mt-1 truncate">/article/{a.slug}</p>

                  <p className="meta mt-1.5">
                    <span className={seoOk ? "text-muted" : "font-medium text-accent"}>
                      {seoOk ? "SEO complete" : "SEO incomplete"}
                    </span>
                    {!a.heroImage && <span className="text-muted"> · no image</span>}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <button
                    onClick={() => setExpanded(isOpen ? null : a.id)}
                    className="meta hover:text-accent"
                  >
                    {isOpen ? "Close" : "Edit SEO"}
                  </button>
                  <button onClick={() => unpublish(a.id)} className="meta hover:text-accent">
                    Unpublish
                  </button>
                </div>
              </div>

              {isOpen && <SeoEditor article={a} onDone={onDone} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Inline SEO editing, with the character budgets that actually matter shown live. */
function SeoEditor({ article, onDone }: { article: Article; onDone: () => void }) {
  const [seoTitle, setSeoTitle] = useState(article.seoTitle || article.title);
  const [metaDescription, setMetaDescription] = useState(
    article.metaDescription || article.summary
  );
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await fetch("/api/articles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: article.id, seoTitle, metaDescription }),
      });
      onDone();
    } finally {
      setBusy(false);
    }
  };

  const titleOver = seoTitle.length > 60;
  const descOver = metaDescription.length > 160;
  const descShort = metaDescription.length < 110;

  return (
    <div className="mt-4 border-l-2 border-rule pl-4">
      <label className="meta block">
        Search title{" "}
        <span className={titleOver ? "font-medium text-accent" : ""}>
          {seoTitle.length}/60
        </span>
      </label>
      <input
        value={seoTitle}
        onChange={(e) => setSeoTitle(e.target.value)}
        className="mt-1 w-full border border-rule-strong bg-surface px-2.5 py-2 font-sans text-meta focus:border-ink focus:outline-none"
      />

      <label className="meta mt-3 block">
        Meta description{" "}
        <span className={descOver || descShort ? "font-medium text-accent" : ""}>
          {metaDescription.length}/160
        </span>
        {descShort && <span className="text-accent"> — under 110 wastes the snippet</span>}
      </label>
      <textarea
        rows={3}
        value={metaDescription}
        onChange={(e) => setMetaDescription(e.target.value)}
        className="mt-1 w-full border border-rule-strong bg-surface px-2.5 py-2 font-sans text-meta focus:border-ink focus:outline-none"
      />

      {/* What the result will actually look like. */}
      <div className="mt-4 border border-rule bg-paper p-3">
        <p className="kicker-muted">Search result preview</p>
        <p className="mt-2 font-sans text-[1.05rem] leading-tight text-[#1a0dab]">
          {seoTitle.slice(0, 60) || "Untitled"}
        </p>
        <p className="font-sans text-[0.75rem] text-[#006621]">/article/{article.slug}</p>
        <p className="font-sans text-[0.8125rem] leading-snug text-muted">
          {metaDescription.slice(0, 160)}
        </p>
      </div>

      <button
        onClick={save}
        disabled={busy}
        className="mt-3 border border-ink bg-ink px-4 py-2 font-sans text-meta font-medium text-paper hover:border-accent hover:bg-accent disabled:opacity-60"
      >
        {busy ? "Saving…" : "Save SEO"}
      </button>
    </div>
  );
}

/* -------------------------------------------------------------- Channels */

function Channels({ items, onDone }: { items: Channel[]; onDone: () => void }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState("RSS");
  const [category, setCategory] = useState("Productivity");

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, handleOrUrl: url, type, category }),
    });
    setName("");
    setUrl("");
    onDone();
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this source?")) return;
    await fetch(`/api/channels?id=${id}`, { method: "DELETE" });
    onDone();
  };

  return (
    <div className="py-6">
      <form onSubmit={add} className="grid gap-2 border-b border-rule pb-6 sm:grid-cols-5">
        <input
          required
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-rule-strong bg-surface px-2.5 py-2 font-sans text-meta focus:border-ink focus:outline-none"
        />
        <input
          required
          placeholder="Feed URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="border border-rule-strong bg-surface px-2.5 py-2 font-sans text-meta focus:border-ink focus:outline-none sm:col-span-2"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="border border-rule-strong bg-surface px-2.5 py-2 font-sans text-meta focus:border-ink focus:outline-none"
        >
          <option value="RSS">RSS</option>
          <option value="SUBSTACK">Substack</option>
          <option value="NEWSLETTER">Newsletter</option>
          <option value="YOUTUBE">YouTube</option>
          <option value="TWITTER">X / Twitter (inactive)</option>
        </select>
        <button className="border border-ink bg-ink px-4 py-2 font-sans text-meta font-medium text-paper hover:border-accent hover:bg-accent">
          Add source
        </button>
      </form>

      <div className="divide-y divide-rule">
        {items.map((c) => (
          <div key={c.id} className="flex items-baseline justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="font-sans text-meta font-medium text-ink">
                {c.name} <span className="text-faint">· {c.type}</span>
                {c.type === "TWITTER" && (
                  <span className="text-accent"> · no adapter, will be skipped</span>
                )}
              </p>
              <p className="meta truncate">{c.handleOrUrl}</p>
            </div>
            <button onClick={() => remove(c.id)} className="meta shrink-0 hover:text-accent">
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- Tools */

function Tools({
  items,
  onDone,
  setNotice,
}: {
  items: Tool[];
  onDone: () => void;
  setNotice: (s: string) => void;
}) {
  return (
    <div className="py-6">
      <p className="meta max-w-measure-wide leading-relaxed">
        A partner link is only ever added here, by hand, after a real agreement exists. Leave it
        blank and the tool is listed as a plain editorial entry pointing at its own site. Nothing
        in the pipeline can create one.
      </p>

      <div className="mt-6 divide-y divide-rule">
        {items.map((tool) => (
          <ToolRow key={tool.id} tool={tool} onDone={onDone} setNotice={setNotice} />
        ))}
      </div>
    </div>
  );
}

function ToolRow({
  tool,
  onDone,
  setNotice,
}: {
  tool: Tool;
  onDone: () => void;
  setNotice: (s: string) => void;
}) {
  const [url, setUrl] = useState(tool.affiliateUrl || "");
  const [busy, setBusy] = useState(false);

  const save = async (status: string) => {
    setBusy(true);
    setNotice("");
    try {
      const res = await fetch("/api/tools", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tool.id, affiliateUrl: url, status }),
      });
      const data = await res.json();
      if (!res.ok) setNotice(data.error || "Update failed.");
      else onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-3 py-4 sm:grid-cols-[1fr_2fr_auto] sm:items-center">
      <div>
        <p className="font-sans text-meta font-medium text-ink">{tool.name}</p>
        <p className="meta">
          {tool.category}
          {tool.status === "ACTIVE" ? " · partner link live" : " · editorial listing"}
          {tool.clicksCount > 0 && ` · ${tool.clicksCount} clicks`}
        </p>
      </div>

      <input
        placeholder="Partner link (leave blank for none)"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="border border-rule-strong bg-surface px-2.5 py-2 font-sans text-meta focus:border-ink focus:outline-none"
      />

      <div className="flex gap-3">
        <button
          disabled={busy}
          onClick={() => save(url.trim() ? "ACTIVE" : "NONE")}
          className="border border-rule-strong px-3 py-2 font-sans text-meta text-muted hover:text-ink disabled:opacity-50"
        >
          Save
        </button>
        {tool.status === "ACTIVE" && (
          <button
            disabled={busy}
            onClick={() => save("NONE")}
            className="meta hover:text-accent disabled:opacity-50"
          >
            Disable
          </button>
        )}
      </div>
    </div>
  );
}

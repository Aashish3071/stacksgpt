import Image from "next/image";
import MediaDetails from "@/components/MediaDetails";
import prisma from "@/lib/db";
import { requireEditor, requireAdmin } from "@/lib/editor-auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import NewsroomResource from "@/components/NewsroomResource";
import {
  NewArticle,
  LeadActions,
  ArticleActions,
  ArticleTile,
  SocialPostActions,
} from "@/components/NewsroomQueue";
import { getSettings } from "@/lib/settings";
import { xEnabled, linkedinEnabled } from "@/lib/social";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
}) {
  await requireEditor();
  const s = (await params).section;
  const search = await searchParams;
  const page = Math.max(1, parseInt(search.page || "1") || 1);
  const skip = (page - 1) * 25;

  const statuses: Record<string, string> = {
    drafts: "DRAFT",
    "in-review": "IN_REVIEW",
    approved: "APPROVED",
    scheduled: "SCHEDULED",
    published: "PUBLISHED",
    rejected: "REJECTED",
    archived: "ARCHIVED",
  };

  let body;

  if (statuses[s]) {
    let where: any;
    if (s === "drafts") {
      where = {
        status: "DRAFT",
        isPublished: false,
      };
    } else if (s === "published") {
      where = {
        isPublished: true,
      };
    } else if (s === "approved") {
      where = {
        status: "APPROVED",
        isPublished: false,
      };
    } else if (s === "in-review") {
      where = {
        status: "IN_REVIEW",
        isPublished: false,
      };
    } else {
      where = {
        status: statuses[s],
      };
    }

    if (search.q) {
      where.title = { contains: search.q, mode: "insensitive" };
    }

    const orderBy: any =
      s === "published" ? { publishedAt: "desc" } : { createdAt: "desc" };

    let items: any[] = [];
    let total = 0;

    try {
      [items, total] = await prisma.$transaction([
        prisma.article.findMany({
          where,
          orderBy,
          take: 25,
          skip,
        }),
        prisma.article.count({ where }),
      ]);
    } catch (err) {
      console.warn(`Could not load articles for status ${s}:`, err);
    }

    body = (
      <>
        <NewArticle />
        <form className="my-5 flex gap-3">
          <input
            aria-label="Search queue"
            name="q"
            defaultValue={search.q}
            placeholder="Search headlines"
            className="border border-rule p-3 text-sm focus:border-ink outline-none"
          />
          <button className="border border-rule px-4 text-sm hover:border-ink transition-colors">
            Search
          </button>
        </form>
        <p className="text-sm text-muted">{total} articles</p>
        {items.length === 0 ? (
          <p className="my-6 text-sm text-muted">No articles found in this state.</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((a) => (
              <ArticleTile key={a.id} article={JSON.parse(JSON.stringify(a))} />
            ))}
          </div>
        )}
        <Pager filters={search} page={page} more={skip + 25 < total} />
      </>
    );
  } else if (s === "leads") {
    let items: any[] = [];

    try {
      items = await prisma.rawNews.findMany({
        where: { status: search.status || "PENDING" },
        include: { channel: true },
        orderBy: { score: "desc" },
        take: 26,
        skip,
      });
    } catch (err) {
      console.warn("Could not load leads:", err);
    }

    body = (
      <>
        <p className="mb-5 text-sm text-muted">
          Fallback discoveries for when you haven’t supplied Antigravity with a
          source. Selecting a lead never publishes an article.
        </p>
        <form className="flex gap-3 my-4">
          <select
            aria-label="Lead status"
            name="status"
            defaultValue={search.status || "PENDING"}
            className="border border-rule p-2 text-sm"
          >
            {["PENDING", "SHORTLISTED", "IGNORED", "SELECTED"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          <button className="border border-rule px-3 text-sm hover:border-ink">
            Filter
          </button>
        </form>
        {items.length === 0 ? (
          <p className="my-6 text-sm text-muted">No leads found.</p>
        ) : (
          items.slice(0, 25).map((l) => (
            <article key={l.id} className="border-b border-rule py-6">
              <h2 className="text-2xl font-serif">{l.title || "Untitled lead"}</h2>
              <p className="my-2 text-sm text-muted">
                {l.channel?.name || "Unknown feed"} · Score {l.score} · {l.id}
              </p>
              <p className="text-sm text-muted mb-2">
                Rule-based signals: relevance {l.relevanceScore}, usefulness{" "}
                {l.usefulnessScore}, recency {l.noveltyScore}. Editors decide what
                is newsworthy.
              </p>
              {l.externalUrl && (
                <a
                  href={l.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-sm"
                >
                  Original source ↗
                </a>
              )}
              <p className="my-4 text-sm leading-relaxed">
                {l.rawText ? l.rawText.slice(0, 500) : ""}
              </p>
              <LeadActions lead={JSON.parse(JSON.stringify(l))} />
            </article>
          ))
        )}
        <Pager filters={search} page={page} more={items.length > 25} />
      </>
    );
  } else if (s === "social-posts") {
    let items: any[] = [];
    let total = 0;

    try {
      const where = {
        status: search.status || "PENDING_APPROVAL",
      };
      [items, total] = await prisma.$transaction([
        prisma.socialPost.findMany({
          where,
          include: { article: { select: { title: true, slug: true, heroImage: true } } },
          orderBy: { createdAt: "desc" },
          take: 25,
          skip,
        }),
        prisma.socialPost.count({ where }),
      ]);
    } catch (err) {
      console.warn("Could not load social posts:", err);
    }

    body = (
      <>
        <p className="mb-5 text-sm text-muted">
          Drafted automatically the first time an article publishes. Nothing
          here sends until you approve it — approving queues it for the next
          delivery run, or use Send now to post immediately.
        </p>
        <form className="flex gap-3 my-4">
          <select
            aria-label="Social post status"
            name="status"
            defaultValue={search.status || "PENDING_APPROVAL"}
            className="border border-rule p-2 text-sm"
          >
            {["PENDING_APPROVAL", "APPROVED", "SENT", "FAILED", "REJECTED"].map(
              (v) => (
                <option key={v}>{v}</option>
              ),
            )}
          </select>
          <button className="border border-rule px-3 text-sm hover:border-ink">
            Filter
          </button>
        </form>
        <p className="text-sm text-muted">{total} social posts</p>
        {items.length === 0 ? (
          <p className="my-6 text-sm text-muted">No social posts found in this state.</p>
        ) : (
          items.map((post) => (
            <article key={post.id} className="border-b border-rule py-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {post.platform === "X" ? "X (Twitter)" : "LinkedIn"}
              </p>
              <Link
                href={`/article/${post.article.slug}`}
                target="_blank"
                className="font-serif text-xl hover:underline"
              >
                {post.article.title}
              </Link>
              {post.error && (
                <p className="text-sm text-accent my-1">{post.error}</p>
              )}
              <div className="mt-3">
                <SocialPostActions post={JSON.parse(JSON.stringify(post))} />
              </div>
            </article>
          ))
        )}
        <Pager filters={search} page={page} more={skip + 25 < total} />
      </>
    );
  } else if (s === "media") {
    let assets: any[] = [];
    let total = 0;
    let usedBy: Record<string, { slug: string; title: string }[]> = {};

    try {
      const where = search.q
        ? { alt: { contains: search.q, mode: "insensitive" as const } }
        : {};
      [assets, total] = await prisma.$transaction([
        prisma.mediaAsset.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: 24,
          skip,
        }),
        prisma.mediaAsset.count({ where }),
      ]);
      // A media asset carries no relation back to the articles using it, so
      // "is this actually in use?" otherwise means opening every article by
      // hand. One extra query answers it for the whole page at once.
      const urls = assets.map((a) => a.url);
      if (urls.length) {
        const inUse = await prisma.article.findMany({
          where: { heroImage: { in: urls } },
          select: { slug: true, title: true, heroImage: true },
        });
        for (const a of inUse) {
          (usedBy[a.heroImage!] ||= []).push({ slug: a.slug, title: a.title });
        }
      }
    } catch (err) {
      console.warn("Could not load media assets:", err);
    }

    body = (
      <>
        <p className="mb-5 text-sm text-muted">
          Every image an article has used as its hero, in one browsable
          library. Upload new images from Sources &amp; image in the article
          editor — this page is for reviewing and correcting what already
          exists.
        </p>
        <form className="my-4 flex gap-3">
          <input
            aria-label="Search media by description"
            name="q"
            defaultValue={search.q}
            placeholder="Search by image description"
            className="border border-rule p-3 text-sm focus:border-ink outline-none"
          />
          <button className="border border-rule px-4 text-sm hover:border-ink transition-colors">
            Search
          </button>
        </form>
        <p className="text-sm text-muted">{total} images</p>
        {assets.length === 0 ? (
          <p className="my-6 text-sm text-muted">No images found.</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {assets.map((asset) => {
              const usage = usedBy[asset.url] || [];
              return (
                <div
                  key={asset.id}
                  className="flex flex-col overflow-hidden rounded-lg border border-rule bg-surface"
                >
                  <div className="relative aspect-[16/9] w-full bg-paper">
                    <Image
                      src={asset.url}
                      alt={asset.alt || ""}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <p className="text-xs text-muted">
                      {asset.width && asset.height
                        ? `${asset.width}×${asset.height}`
                        : "Dimensions unknown"}
                      {asset.byteSize
                        ? ` · ${Math.round(asset.byteSize / 1024)} KB`
                        : ""}
                      {" · "}
                      {asset.origin}
                    </p>
                    {usage.length > 0 ? (
                      <p className="text-xs text-emerald-700">
                        In use by{" "}
                        {usage.map((u, i) => (
                          <span key={u.slug}>
                            {i > 0 && ", "}
                            <Link
                              href={`/article/${u.slug}`}
                              target="_blank"
                              className="underline"
                            >
                              {u.title}
                            </Link>
                          </span>
                        ))}
                      </p>
                    ) : (
                      <p className="text-xs text-muted">
                        Not currently used as a hero image.
                      </p>
                    )}
                    <div className="mt-auto pt-2">
                      <MediaDetails asset={JSON.parse(JSON.stringify(asset))} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <Pager filters={search} page={page} more={skip + 24 < total} />
      </>
    );
  } else if (["imports", "audit", "analytics"].includes(s)) {
    let rows: any[] = [];

    try {
      rows =
        s === "imports"
          ? await prisma.importAttempt.findMany({
              orderBy: { createdAt: "desc" },
              take: 26,
              skip,
            })
          : s === "audit"
            ? await prisma.auditLog.findMany({
                orderBy: { createdAt: "desc" },
                take: 26,
                skip,
              })
            : await prisma.eventDaily.findMany({
                orderBy: { day: "desc" },
                take: 26,
                skip,
              });
    } catch (err) {
      console.warn(`Could not load records for ${s}:`, err);
    }

    body = (
      <>
        {s === "analytics" && (
          <p className="text-sm text-muted mb-4">
            Daily consented engagement counts. Raw search queries and reader
            identities are not stored.
          </p>
        )}
        {rows.length === 0 ? (
          <p className="my-6 text-sm text-muted">No records found.</p>
        ) : (
          rows.slice(0, 25).map((r: any) => (
            <article key={r.id || r.key} className="border-b border-rule py-4">
              <strong className="block text-ink">
                {r.externalId || r.action || r.event}
              </strong>
              <p className="text-sm text-muted my-1">
                {r.status ||
                  r.day ||
                  (r.createdAt ? new Date(r.createdAt).toLocaleString() : "")}{" "}
                {r.count !== undefined ? `· ${r.count} events` : ""}
              </p>
              {Array.isArray(r.errors) && r.errors.length > 0 && (
                <ul className="text-xs text-accent my-2 list-disc list-inside">
                  {r.errors.map((e: any, i: number) => (
                    <li key={i}>{String(e)}</li>
                  ))}
                </ul>
              )}
            </article>
          ))
        )}
        <Pager filters={search} page={page} more={rows.length > 25} />
      </>
    );
  } else {
    await requireAdmin();
    let rows: any[] = [],
      initial: any = {},
      fields: any[] = [];
    const f = (
      key: string,
      label: string,
      type?: string,
      options?: string[],
    ) => ({ key, label, type, options });

    if (s === "sources") {
      try {
        rows = await prisma.channel.findMany({
          take: 100,
          orderBy: { name: "asc" },
        });
      } catch (err) {
        console.warn("Could not load sources:", err);
      }
      initial = {
        name: "",
        handleOrUrl: "",
        type: "RSS",
        category: "Research",
        isActive: true,
        pollingEnabled: true,
      };
      fields = [
        f("name", "Name"),
        f("handleOrUrl", "Feed URL"),
        f("type", "Source type", undefined, ["RSS", "YOUTUBE", "SUBSTACK"]),
        f("category", "Category"),
        f("isActive", "Active", "boolean"),
        f("pollingEnabled", "Fallback polling enabled", "boolean"),
      ];
    } else if (["categories", "tags", "audiences"].includes(s)) {
      const kind = (
        { categories: "CATEGORY", tags: "TAG", audiences: "AUDIENCE" } as any
      )[s];
      try {
        rows = await prisma.taxonomy.findMany({ where: { kind }, take: 100 });
      } catch (err) {
        console.warn(`Could not load taxonomy ${kind}:`, err);
      }
      initial = { name: "", slug: "", description: "", active: true };
      fields = [
        f("name", "Name"),
        f("slug", "URL slug"),
        f("description", "Description", "long"),
        f("active", "Active", "boolean"),
      ];
    } else if (s === "settings") {
      initial = await getSettings();
      fields = [
        f("name", "Publication name"),
        f("tagline", "Tagline"),
        f("contactEmail", "Contact email"),
        f("socialLinks", "Social links", "json"),
        f("rssFallbackEnabled", "RSS fallback enabled", "boolean"),
        f("adsEnabled", "Enable advertising", "boolean"),
        f("adsProvider", "Ad mode", undefined, [
          "disabled",
          "placeholder",
          "adsense",
        ]),
        f("adsenseId", "AdSense publisher ID"),
        f("adUnits", "Ad placement IDs", "json"),
        f("analyticsEnabled", "Enable consented analytics", "boolean"),
        f("ga4Id", "GA4 measurement ID"),
        f("searchConsoleId", "Search Console verification"),
      ];
    } else if (s === "partners") {
      try {
        rows = await prisma.partner.findMany({ take: 100 });
      } catch (err) {
        console.warn("Could not load partners:", err);
      }
      initial = { name: "", website: "", disclosure: "", active: false };
      fields = [
        f("name", "Partner name"),
        f("website", "Website"),
        f("disclosure", "Disclosure", "long"),
        f("active", "Active relationship", "boolean"),
      ];
    } else if (s === "partner-links") {
      try {
        rows = await prisma.partnerLink.findMany({ take: 100 });
      } catch (err) {
        console.warn("Could not load partner links:", err);
      }
      initial = { partnerId: "", label: "", url: "", active: false };
      fields = [
        f("partnerId", "Partner record ID"),
        f("label", "Link label"),
        f("url", "Actual agreed destination URL"),
        f("active", "Active", "boolean"),
      ];
    } else if (s === "profiles") {
      try {
        rows = await prisma.profile.findMany({ take: 100 });
      } catch (err) {
        console.warn("Could not load profiles:", err);
      }
      initial = {
        id: "",
        email: "",
        displayName: "",
        role: "EDITOR",
        active: true,
      };
      fields = [
        f("id", "Supabase Auth user ID"),
        f("email", "Invited email"),
        f("displayName", "Display name"),
        f("role", "Role", undefined, ["EDITOR", "ADMIN"]),
        f("active", "Active", "boolean"),
      ];
    } else if (s === "newsletters") {
      try {
        rows = await prisma.newsletter.findMany({
          take: 100,
          orderBy: { createdAt: "desc" },
        });
      } catch (err) {
        console.warn("Could not load newsletters:", err);
      }
      initial = { subject: "", body: "" };
      fields = [
        f("subject", "Subject"),
        f("body", "Newsletter body (Markdown)", "long"),
      ];
    } else notFound();

    body = (
      <>
        {s === "settings" && (
          <div className="mb-6 flex flex-wrap gap-2 text-xs font-semibold">
            {[
              ["X (Twitter)", xEnabled()],
              ["LinkedIn", linkedinEnabled()],
            ].map(([label, connected]) => (
              <span
                key={label as string}
                className={`rounded-full border px-3 py-1 ${
                  connected
                    ? "border-emerald-600/40 bg-emerald-50 text-emerald-700"
                    : "border-rule bg-paper text-muted"
                }`}
              >
                {label}: {connected ? "Connected" : "Not connected"}
              </span>
            ))}
          </div>
        )}
        <NewsroomResource
          section={s}
          rows={JSON.parse(JSON.stringify(rows))}
          initial={initial}
          fields={fields}
        />
      </>
    );
  }

  return (
    <>
      <h1 className="font-serif text-4xl mb-7 capitalize">
        {s.replaceAll("-", " ")}
      </h1>
      {body}
    </>
  );
}

function Pager({
  page,
  more,
  filters,
}: {
  page: number;
  more: boolean;
  filters: { q?: string; status?: string };
}) {
  return (
    <nav className="flex gap-5 mt-8 text-sm" aria-label="Pagination">
      {page > 1 && (
        <Link
          className="underline font-medium hover:text-ink"
          href={`?${new URLSearchParams({ ...filters, page: String(page - 1) } as Record<string, string>)}`}
        >
          ← Previous
        </Link>
      )}
      <span className="text-muted">Page {page}</span>
      {more && (
        <Link
          className="underline font-medium hover:text-ink"
          href={`?${new URLSearchParams({ ...filters, page: String(page + 1) } as Record<string, string>)}`}
        >
          Next →
        </Link>
      )}
    </nav>
  );
}

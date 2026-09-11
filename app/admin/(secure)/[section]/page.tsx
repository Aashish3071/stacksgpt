import Image from "next/image";
import MediaDetails from "@/components/MediaDetails";
import prisma from "@/lib/db";
import { editor, admin } from "@/lib/editor-auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import NewsroomResource from "@/components/NewsroomResource";
import { NewArticle, LeadActions } from "@/components/NewsroomQueue";
import { getSettings } from "@/lib/settings";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
}) {
  await editor();
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
    const where: any = {
      OR: [{ status: statuses[s] }, { pendingStatus: statuses[s] }],
      ...(search.q
        ? { title: { contains: search.q, mode: "insensitive" } }
        : {}),
    };
    const [items, total] = await prisma.$transaction([
      prisma.article.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 25,
        skip,
      }),
      prisma.article.count({ where }),
    ]);
    body = (
      <>
        <NewArticle />
        <form className="my-5 flex gap-3">
          <input
            aria-label="Search queue"
            name="q"
            defaultValue={search.q}
            placeholder="Search headlines"
            className="border p-3"
          />
          <button className="border px-4">Search</button>
        </form>
        <p>{total} articles</p>
        {items.map((a) => (
          <article key={a.id} className="border-b py-5">
            <Link
              href={`/admin/articles/${a.id}`}
              className="font-serif text-2xl underline"
            >
              {a.title}
            </Link>
            <p className="my-2 text-sm">
              {a.pendingStatus || a.status} · {a.category} ·{" "}
              {a.sourceAuthor || "Source not set"}
            </p>
            {a.rejectionReason && <p>{a.rejectionReason}</p>}
            <Link href={`/admin/preview/${a.id}`} className="underline text-sm">
              Private preview ↗
            </Link>
          </article>
        ))}
        <Pager filters={search} page={page} more={skip + 25 < total} />
      </>
    );
  } else if (s === "leads") {
    const items = await prisma.rawNews.findMany({
      where: { status: search.status || "PENDING" },
      include: { channel: true },
      orderBy: { score: "desc" },
      take: 26,
      skip,
    });
    body = (
      <>
        <p className="mb-5">
          Fallback discoveries for when you haven’t supplied Antigravity with a
          source. Selecting a lead never publishes an article.
        </p>
        <form className="flex gap-3 my-4">
          <select
            aria-label="Lead status"
            name="status"
            defaultValue={search.status || "PENDING"}
            className="border p-2"
          >
            {["PENDING", "SHORTLISTED", "IGNORED", "SELECTED"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          <button className="border p-2">Filter</button>
        </form>
        {items.slice(0, 25).map((l) => (
          <article key={l.id} className="border-b py-6">
            <h2 className="text-2xl font-serif">{l.title}</h2>
            <p className="my-2 text-sm">
              {l.channel.name} · Score {l.score} · {l.id}
            </p>
            <p className="text-sm mb-2">
              Rule-based signals: relevance {l.relevanceScore}, usefulness{" "}
              {l.usefulnessScore}, recency {l.noveltyScore}. Editors decide what
              is newsworthy.
            </p>
            <a
              href={l.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Original source ↗
            </a>
            <p className="my-4">{l.rawText.slice(0, 500)}</p>
            <LeadActions lead={JSON.parse(JSON.stringify(l))} />
          </article>
        ))}
        <Pager filters={search} page={page} more={items.length > 25} />
      </>
    );
  } else if (["imports", "audit", "analytics", "media"].includes(s)) {
    const rows =
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
          : s === "analytics"
            ? await prisma.eventDaily.findMany({
                orderBy: { day: "desc" },
                take: 26,
                skip,
              })
            : await prisma.mediaAsset.findMany({
                orderBy: { createdAt: "desc" },
                take: 26,
                skip,
              });
    body = (
      <>
        {s === "analytics" && (
          <p>
            Daily consented engagement counts. Raw search queries and reader
            identities are not stored.
          </p>
        )}
        {s === "media" && (
          <p>
            Upload article images from Sources & image in the article editor.
          </p>
        )}
        {rows.slice(0, 25).map((r: any) => (
          <article key={r.id} className="border-b py-4">
            <strong>
              {r.externalId || r.action || r.event || r.alt || r.url}
            </strong>
            <p>
              {r.status || r.day || new Date(r.createdAt).toLocaleString()}{" "}
              {r.count !== undefined ? `· ${r.count} events` : ""}
            </p>
            {r.errors && (
              <ul>
                {(r.errors as string[]).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}
            {s === "media" && (
              <MediaDetails asset={JSON.parse(JSON.stringify(r))} />
            )}{" "}
            {r.url && (
              <Image
                src={r.url}
                alt={r.alt}
                width={300}
                height={160}
                className="max-w-xs mt-3"
              />
            )}
          </article>
        ))}
        <Pager filters={search} page={page} more={rows.length > 25} />
      </>
    );
  } else {
    await admin();
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
      rows = await prisma.channel.findMany({
        take: 100,
        orderBy: { name: "asc" },
      });
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
      rows = await prisma.taxonomy.findMany({ where: { kind }, take: 100 });
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
      rows = await prisma.partner.findMany({ take: 100 });
      initial = { name: "", website: "", disclosure: "", active: false };
      fields = [
        f("name", "Partner name"),
        f("website", "Website"),
        f("disclosure", "Disclosure", "long"),
        f("active", "Active relationship", "boolean"),
      ];
    } else if (s === "partner-links") {
      rows = await prisma.partnerLink.findMany({ take: 100 });
      initial = { partnerId: "", label: "", url: "", active: false };
      fields = [
        f("partnerId", "Partner record ID"),
        f("label", "Link label"),
        f("url", "Actual agreed destination URL"),
        f("active", "Active", "boolean"),
      ];
    } else if (s === "profiles") {
      rows = await prisma.profile.findMany({ take: 100 });
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
      rows = await prisma.newsletter.findMany({
        take: 100,
        orderBy: { createdAt: "desc" },
      });
      initial = { subject: "", body: "" };
      fields = [
        f("subject", "Subject"),
        f("body", "Newsletter body (Markdown)", "long"),
      ];
    } else notFound();
    body = (
      <NewsroomResource
        section={s}
        rows={JSON.parse(JSON.stringify(rows))}
        initial={initial}
        fields={fields}
      />
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
    <nav className="flex gap-5 mt-8" aria-label="Pagination">
      {page > 1 && (
        <Link
          href={`?${new URLSearchParams({ ...filters, page: String(page - 1) } as Record<string, string>)}`}
        >
          ← Previous
        </Link>
      )}
      <span>Page {page}</span>
      {more && (
        <Link
          href={`?${new URLSearchParams({ ...filters, page: String(page + 1) } as Record<string, string>)}`}
        >
          Next →
        </Link>
      )}
    </nav>
  );
}

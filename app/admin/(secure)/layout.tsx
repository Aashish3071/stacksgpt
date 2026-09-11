import Link from "next/link";
import SessionControls from "@/components/SessionControls";
import { requireEditor } from "@/lib/editor-auth";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Newsroom · StacksGPT",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-video-preview": -1,
      "max-image-preview": "none",
      "max-snippet": -1,
    },
  },
};
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const p = await requireEditor();
  const nav = [
    ["", "Dashboard"],
    ["leads", "Story leads"],
    ["drafts", "Drafts"],
    ["in-review", "In review"],
    ["approved", "Approved"],
    ["scheduled", "Scheduled"],
    ["published", "Published"],
    ["rejected", "Rejected"],
    ["imports", "Import results"],
    ["media", "Media"],
    ["categories", "Categories"],
    ["tags", "Tags"],
    ["audiences", "Audiences"],
    ["sources", "Sources"],
    ["partners", "Partners"],
    ["partner-links", "Partner links"],
    ["profiles", "Editorial accounts"],
    ["newsletters", "Newsletters"],
    ["analytics", "Analytics"],
    ["audit", "Audit log"],
    ["settings", "Settings"],
  ];
  return (
    <div className="mx-auto max-w-[1500px] grid lg:grid-cols-[220px_1fr] min-h-screen">
      <aside className="border-r p-5">
        <h2 className="font-serif text-xl">The newsroom</h2>
        <p className="text-sm my-3">
          {p.displayName} · {p.role.toLowerCase()}
        </p>
        <nav className="flex overflow-x-auto lg:flex-col gap-1">
          {nav
            .filter(
              ([slug]) =>
                p.role === "ADMIN" ||
                ![
                  "categories",
                  "tags",
                  "audiences",
                  "sources",
                  "partners",
                  "partner-links",
                  "profiles",
                  "newsletters",
                  "settings",
                ].includes(slug),
            )
            .map(([slug, label]) => (
              <Link
                key={slug}
                href={`/admin${slug ? "/" + slug : ""}`}
                className="px-3 py-2 hover:bg-slate-100 whitespace-nowrap text-sm"
              >
                {label}
              </Link>
            ))}
        </nav>
        <Link href="/" className="block underline mt-6 text-sm">
          View publication ↗
        </Link>
        <SessionControls />
      </aside>
      <div className="p-5 sm:p-8 min-w-0">{children}</div>
    </div>
  );
}

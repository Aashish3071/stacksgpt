import Link from "next/link";

const TABS = [
  { key: "blueprints", href: "/blueprints", label: "Blueprints", hint: "Step-by-step guides" },
  {
    key: "templates",
    href: "/blueprints/templates",
    label: "Workflow Templates",
    hint: "Downloadable workflows",
  },
] as const;

export default function LibraryTabs({ active }: { active: "blueprints" | "templates" }) {
  return (
    <nav
      aria-label="Library sections"
      className="mt-6 inline-flex flex-wrap gap-1 rounded-[2px] border border-rule bg-surface p-1"
    >
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-[2px] px-4 py-2 text-left transition ${
              isActive ? "bg-ink text-paper shadow-sm" : "text-ink/70 hover:bg-paper hover:text-ink"
            }`}
          >
            <span className="block text-xs font-semibold uppercase tracking-wider">{tab.label}</span>
            <span className={`block text-[11px] ${isActive ? "text-paper/70" : "text-ink/50"}`}>
              {tab.hint}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

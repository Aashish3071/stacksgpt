import Link from "next/link";
import { Zap } from "lucide-react";
import { templateCategoryLabel, type WorkflowTemplate } from "@/lib/templates";

export default function TemplateCard({ template }: { template: WorkflowTemplate }) {
  const href = `/blueprints/templates/${template.slug}`;
  const shownApps = template.apps.slice(0, 3);
  const hiddenAppCount = template.apps.length - shownApps.length;

  return (
    <article className="group flex flex-col justify-between border border-rule bg-paper p-5 transition hover:border-ink/40">
      <div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-accent">
          {templateCategoryLabel(template.category)}
        </span>
        <h3 className="mt-2 font-serif text-lg font-bold leading-snug text-ink group-hover:text-accent">
          <Link href={href}>{template.title}</Link>
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-ink/75 line-clamp-3">{template.summary}</p>
      </div>

      <div className="mt-4 border-t border-rule pt-3 text-[11px] text-ink/70">
        <p className="inline-flex items-center gap-1">
          <Zap className="h-3 w-3 shrink-0" />
          <span>Starts on: {template.triggers.join(", ")}</span>
        </p>
        {shownApps.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {shownApps.map((app) => (
              <span
                key={app}
                className="rounded border border-rule bg-surface px-1.5 py-0.5 font-mono text-[10px] text-ink/70"
              >
                {app}
              </span>
            ))}
            {hiddenAppCount > 0 && (
              <span className="px-1 py-0.5 font-mono text-[10px] text-ink/50">
                +{hiddenAppCount} more
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

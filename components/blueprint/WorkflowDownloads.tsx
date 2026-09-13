import Link from "next/link";
import { Download } from "lucide-react";

interface Props {
  downloads: { slug: string; title: string }[];
}

export default function WorkflowDownloads({ downloads }: Props) {
  return (
    <section
      aria-labelledby="workflow-downloads"
      className="rounded-[2px] border border-rule bg-surface p-5 sm:p-6"
    >
      <h2 id="workflow-downloads" className="font-serif text-xl font-bold text-ink">
        {downloads.length === 1 ? "Your workflow file" : "Your workflow files"}
      </h2>
      <p className="mt-1 text-sm text-ink/70">
        Import the file into n8n, then follow the steps below to connect your own accounts.
      </p>
      <ul className="mt-4 space-y-3">
        {downloads.map((d) => (
          <li
            key={d.slug}
            className="flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-3 first:border-t-0 first:pt-0"
          >
            <Link
              href={`/blueprints/templates/${d.slug}`}
              className="text-sm font-medium text-ink hover:text-accent"
            >
              {d.title}
            </Link>
            <a
              href={`/api/templates/${d.slug}/download`}
              download
              className="inline-flex items-center gap-1.5 rounded-[2px] bg-ink px-3 py-2 text-xs font-semibold text-paper transition hover:bg-ink/90"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

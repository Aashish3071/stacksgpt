import { CheckCircle } from "lucide-react";
import EmailUnlockForm from "@/components/blueprint/EmailUnlockForm";

interface Props {
  slug: string;
  downloads: { slug: string; title: string }[];
}

export default function BlueprintGate({ slug, downloads }: Props) {
  const hasFile = downloads.length > 0;
  const includes = [
    "Step-by-step setup",
    "Copy-paste prompt",
    hasFile ? "Workflow file to import" : "Tips to keep it running",
  ];

  return (
    <section
      id="unlock"
      aria-labelledby="unlock-heading"
      className="mt-12 scroll-mt-24 rounded-[2px] border-2 border-ink bg-surface p-6 sm:p-8"
    >
      <span className="text-[11px] font-semibold uppercase tracking-wider text-accent">Free guide</span>
      <h2 id="unlock-heading" className="mt-1 font-serif text-2xl font-bold text-ink">
        Unlock the full step-by-step guide
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-ink/75">
        {hasFile
          ? "Enter your email to see the setup steps and the copy-paste prompt. Your workflow file downloads straight away."
          : "Enter your email to see the setup steps and the copy-paste prompt."}
      </p>

      <ul className="mt-4 grid gap-2 text-sm text-ink/80 sm:grid-cols-3">
        {includes.map((item) => (
          <li key={item} className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0 text-accent" />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <EmailUnlockForm
          slug={slug}
          kind="blueprint"
          downloadSlug={downloads[0]?.slug}
          submitLabel={hasFile ? "Unlock and download" : "Unlock the guide"}
          inputId="blueprint-unlock-email"
        />
      </div>
    </section>
  );
}

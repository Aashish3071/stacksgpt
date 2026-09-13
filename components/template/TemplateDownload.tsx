import { Download } from "lucide-react";
import EmailUnlockForm from "@/components/blueprint/EmailUnlockForm";

interface Props {
  slug: string;
  isMember: boolean;
}

export default function TemplateDownload({ slug, isMember }: Props) {
  if (isMember) {
    return (
      <div>
        <a
          href={`/api/templates/${slug}/download`}
          download
          className="flex w-full items-center justify-center gap-2 rounded-[2px] bg-ink px-4 py-2.5 text-sm font-semibold text-paper transition hover:bg-ink/90"
        >
          <Download className="h-4 w-4" />
          <span>Download workflow file</span>
        </a>
        <ol className="mt-4 list-decimal space-y-1.5 pl-4 text-xs leading-relaxed text-ink/75">
          <li>Open n8n and create a new workflow.</li>
          <li>Open the workflow menu and choose Import from File.</li>
          <li>Select the downloaded file, then add your own credentials to each node that needs them.</li>
          <li>Pick your own sheets, folders and channels where fields are empty, and test before activating.</li>
        </ol>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed text-ink/75">
        Enter your email and the workflow file downloads straight away. It also unlocks every blueprint
        guide on the site.
      </p>
      <EmailUnlockForm
        slug={slug}
        kind="template"
        downloadSlug={slug}
        submitLabel="Unlock and download"
        inputId="template-unlock-email"
        layout="stacked"
      />
    </div>
  );
}

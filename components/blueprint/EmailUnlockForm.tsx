"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface Props {
  slug: string;
  kind: "blueprint" | "template";
  /** Template whose workflow file downloads as soon as the email is accepted. */
  downloadSlug?: string;
  submitLabel: string;
  inputId: string;
  layout?: "inline" | "stacked";
}

function startDownload(href: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = "";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export default function EmailUnlockForm({
  slug,
  kind,
  downloadSlug,
  submitLabel,
  inputId,
  layout = "inline",
}: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/blueprints/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, slug, kind }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Something went wrong. Please try again.");

      // The unlock response sets the member cookie, so the download request is authorized.
      if (downloadSlug) startDownload(`/api/templates/${downloadSlug}/download`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className={layout === "inline" ? "flex flex-col gap-2 sm:flex-row" : "flex flex-col gap-2"}>
        <label htmlFor={inputId} className="sr-only">
          Email address
        </label>
        <input
          id={inputId}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
          disabled={loading}
          className="min-h-[44px] flex-1 rounded-[2px] border border-rule-strong bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[2px] bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-ink/90 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Unlocking...</span>
            </>
          ) : (
            <span>{submitLabel}</span>
          )}
        </button>
      </div>

      {error && <p className="text-xs font-medium text-red-600">{error}</p>}

      <p className="text-[11px] leading-relaxed text-ink/60">
        Free. By unlocking, you join the StacksGPT newsletter with new blueprints and AI news.
        Unsubscribe anytime. See our{" "}
        <Link href="/privacy" className="underline hover:text-ink">
          privacy policy
        </Link>
        .
      </p>
    </form>
  );
}

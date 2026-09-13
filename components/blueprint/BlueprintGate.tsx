"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Inbox, CheckCircle2, Loader2, Mail } from "lucide-react";

interface Props {
  slug: string;
  manifest?: string;
}

export default function BlueprintGate({
  slug,
  manifest = "Step-by-step setup · Production templates · Starter prompts",
}: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/blueprints/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, slug }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Unlock failed. Please try again.");
      }

      setUnlocked(true);
      // Refresh the page server components so gated content renders
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unlock failed.");
    } finally {
      setLoading(false);
    }
  }

  if (unlocked) {
    return (
      <div className="my-8 rounded-[2px] border border-emerald-300 bg-emerald-50/80 p-6 text-center text-emerald-900">
        <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
        <h3 className="font-serif text-lg font-bold">Blueprint Unlocked &amp; Sent</h3>
        <p className="mt-1 text-xs text-emerald-700">
          Loading the full setup runbook and templates below now.
        </p>
      </div>
    );
  }

  return (
    <div className="relative my-10">
      {/* Blurred / skeleton placeholder lines simulating gated text */}
      <div className="space-y-3 opacity-30 select-none pointer-events-none" aria-hidden="true">
        <div className="h-4 w-11/12 rounded bg-ink/30" />
        <div className="h-4 w-3/4 rounded bg-ink/20" />
        <div className="h-4 w-5/6 rounded bg-ink/25" />
        <div className="h-24 w-full rounded bg-ink/10" />
        <div className="h-4 w-2/3 rounded bg-ink/20" />
      </div>

      {/* Floating gate card: Get Free Blueprint to your inbox */}
      <div className="relative -mt-36 mx-auto max-w-lg rounded-[2px] border border-ink/20 bg-paper p-6 sm:p-8 shadow-xl">
        <div className="text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent mb-3">
            <Inbox className="h-5 w-5" />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-accent font-sans">
            Free Template Access
          </span>
          <h3 className="mt-1 font-serif text-2xl font-bold text-ink">
            Get Free Blueprint in Your Inbox
          </h3>
          <p className="mt-2 text-xs font-medium text-ink/70">
            Enter your email to receive this complete workflow blueprint, production templates, and copy-paste prompts.
          </p>
          <p className="mt-1 text-[11px] text-ink/50 font-mono">
            {manifest}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <div>
            <label htmlFor="gate-email" className="sr-only">
              Work email address
            </label>
            <input
              id="gate-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your work email"
              required
              disabled={loading}
              className="w-full rounded-[2px] border border-rule bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-[2px] bg-ink px-4 py-2.5 text-sm font-semibold text-paper hover:bg-ink/90 transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Unlocking &amp; Sending...</span>
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 text-accent" />
                <span>Get Free Blueprint</span>
              </>
            )}
          </button>

          <p className="text-center text-[11px] text-ink/60">
            Free instant access. No spam. One click unsubscribe anytime.
          </p>
        </form>
      </div>
    </div>
  );
}

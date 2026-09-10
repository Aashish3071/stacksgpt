"use client";

import React, { useState } from "react";

export default function NewsletterCard() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "Subscription failed.");
        setStatus("error");
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
      setStatus("error");
    }
  };

  return (
    <section id="newsletter" className="border-t border-rule py-10 sm:py-12">
      <div className="max-w-measure-wide">
        <h2 className="kicker">The daily briefing</h2>
        <p className="mt-2 font-serif text-head-md text-ink">
          One email each morning: what shipped in AI, and what you can do with it.
        </p>
        <p className="meta mt-2 leading-relaxed">
          No buzzwords and no equations — just the practical version, with prompts you can copy.
        </p>

        {status === "success" ? (
          <p className="mt-5 border-l-2 border-accent pl-3 font-sans text-meta text-ink">
            You&rsquo;re subscribed. The next briefing goes out tomorrow morning.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 flex max-w-md flex-col gap-2 sm:flex-row">
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 border border-rule-strong bg-surface px-3 py-2.5 font-sans text-meta text-ink placeholder:text-faint focus:border-ink focus:outline-none"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="border border-ink bg-ink px-5 py-2.5 font-sans text-meta font-medium text-paper transition-colors hover:bg-accent hover:border-accent disabled:opacity-60"
            >
              {status === "loading" ? "Subscribing…" : "Subscribe"}
            </button>
          </form>
        )}

        {status === "error" && (
          <p className="mt-2 font-sans text-meta text-accent">{errorMessage}</p>
        )}

        <p className="meta mt-3">Unsubscribe in one click. We never share your address.</p>
      </div>
    </section>
  );
}

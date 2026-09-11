"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function SubscribeModal({ isOpen, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = "hidden";
      setStatus("idle");
      setMessage("");
    } else {
      document.body.style.overflow = "";
      setEmail("");
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "nav_modal" }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage("Thank you! Please check your inbox to confirm your subscription.");
      } else {
        setStatus("error");
        setMessage(data.error || "Subscription failed. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Could not connect. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md rounded-xl border border-rule bg-surface p-6 shadow-2xl transition-all">
        <div className="flex items-center justify-between border-b border-rule pb-3">
          <span className="font-mono text-xs uppercase tracking-widest text-accent font-semibold">
            Newsletter
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted hover:bg-paper hover:text-ink transition-colors"
            aria-label="Close subscription modal"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="mt-4">
          <h3 className="font-serif text-xl font-bold text-ink">
            The StacksGPT Intelligence Briefing
          </h3>
          <p className="meta mt-2 text-sm leading-relaxed text-muted">
            We track the latest AI and tech developments so you do not have to,
            delivering what is new and why it matters. Clear analysis, zero marketing fluff.
          </p>
        </div>

        {status === "success" ? (
          <div className="mt-6 rounded-lg border border-accent/30 bg-accent/10 p-4 text-center">
            <p className="font-serif text-sm font-medium text-ink">{message}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 rounded-md bg-ink px-4 py-1.5 font-sans text-xs font-medium text-surface hover:bg-ink/90"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6">
            <div className="flex flex-col gap-3">
              <input
                ref={inputRef}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-lg border border-rule bg-paper px-3.5 py-2.5 font-sans text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full rounded-lg bg-ink py-2.5 font-sans text-sm font-medium text-surface hover:bg-ink/90 disabled:opacity-50 transition-all shadow-sm"
              >
                {status === "loading" ? "Subscribing..." : "Subscribe for free"}
              </button>
            </div>

            {status === "error" && (
              <p className="mt-3 text-xs text-red-600 dark:text-red-400">
                {message}
              </p>
            )}

            <p className="meta mt-4 text-center text-[11px] text-muted">
              Free forever. No spam. Unsubscribe anytime in one click.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

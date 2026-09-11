"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-paper">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block group">
            <Logo size="lg" />
          </Link>
          <h1 className="mt-6 font-serif text-3xl font-semibold text-ink">
            Editorial sign in
          </h1>
          <p className="mt-2 text-sm text-muted">
            Access the newsroom dashboard and review queue.
          </p>
        </div>

        <div className="rounded-xl border border-rule bg-surface p-8 shadow-sm">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              setMessage("");
              try {
                const r = await fetch("/api/admin/login", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email, password }),
                });
                const d = await r.json();
                if (!r.ok) throw Error(d.error);
                window.location.assign("/admin");
              } catch (e) {
                setMessage(e instanceof Error ? e.message : "Sign-in failed");
                setLoading(false);
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                Editorial Email
              </label>
              <input
                type="email"
                autoComplete="username"
                required
                placeholder="editor@stacksgpt.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-rule bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-ink"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                Password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-rule bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-ink"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-ink py-2.5 text-center font-sans text-sm font-semibold text-surface transition-all hover:bg-ink/90 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in to Newsroom"}
            </button>

            {message && (
              <p role="status" className="text-center text-xs font-medium text-accent pt-1">
                {message}
              </p>
            )}
          </form>
        </div>

        <p className="mt-8 text-center text-xs text-muted">
          <Link href="/" className="hover:text-ink underline">
            ← Return to publication
          </Link>
        </p>
      </div>
    </div>
  );
}

"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "@/components/Logo";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (res.ok) {
        router.push(params.get("next") || "/admin");
        router.refresh();
      } else {
        setError(data.error || "Login failed.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm px-4 py-20">
      <div className="mb-6">
        <Logo size="md" />
      </div>
      <h1 className="font-serif text-head-md font-semibold text-ink">Admin sign in</h1>

      <form onSubmit={submit} className="mt-6 space-y-3">
        <label htmlFor="password" className="meta block">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoFocus
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-rule-strong bg-surface px-3 py-2.5 font-sans text-meta text-ink focus:border-ink focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full border border-ink bg-ink px-5 py-2.5 font-sans text-meta font-medium text-paper hover:bg-accent hover:border-accent disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {error && <p className="mt-3 font-sans text-meta text-accent">{error}</p>}
    </div>
  );
}

/**
 * useSearchParams needs a Suspense boundary, otherwise the whole route opts out
 * of static rendering and the production build fails on prerender.
 */
export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-sm px-4 py-20" />}>
      <LoginForm />
    </Suspense>
  );
}

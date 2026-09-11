"use client";
import { useState } from "react";
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  return (
    <section className="mx-auto max-w-lg p-8 py-20">
      <h1 className="font-serif text-3xl">Editorial sign in</h1>
      <p className="my-4">Use your invited Supabase editorial account.</p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setMessage("Signing in…");
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
          }
        }}
        className="space-y-5"
      >
        <label className="block">
          Email
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full border p-3"
          />
        </label>
        <label className="block">
          Password
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full border p-3"
          />
        </label>
        <button className="bg-ink text-paper px-6 py-3">Sign in</button>
        <p role="status">{message}</p>
      </form>
    </section>
  );
}

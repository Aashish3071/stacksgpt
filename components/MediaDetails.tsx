"use client";
import { useState } from "react";
export default function MediaDetails({ asset }: { asset: any }) {
  const [alt, setAlt] = useState(asset.alt);
  const [credit, setCredit] = useState(asset.credit);
  const [origin, setOrigin] = useState(asset.origin);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const inputId = `media-${asset.id}`;
  return (
    <form
      className="space-y-2.5"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const r = await fetch("/api/newsroom/media-details", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: asset.id, alt, credit, origin }),
          });
          const b = await r.json();
          setMessage(r.ok ? "Saved." : b.error);
        } catch {
          setMessage("Could not save media details.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <label
        className="block text-xs font-semibold text-muted"
        htmlFor={`${inputId}-alt`}
      >
        Description (alt text)
        <input
          id={`${inputId}-alt`}
          className="mt-1 block w-full rounded border border-rule bg-paper p-2 text-sm text-ink focus:border-ink focus:outline-none"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          required
        />
      </label>
      <label
        className="block text-xs font-semibold text-muted"
        htmlFor={`${inputId}-credit`}
      >
        Credit
        <input
          id={`${inputId}-credit`}
          className="mt-1 block w-full rounded border border-rule bg-paper p-2 text-sm text-ink focus:border-ink focus:outline-none"
          value={credit}
          onChange={(e) => setCredit(e.target.value)}
          required
        />
      </label>
      <label
        className="block text-xs font-semibold text-muted"
        htmlFor={`${inputId}-origin`}
      >
        Origin
        <select
          id={`${inputId}-origin`}
          className="mt-1 block w-full rounded border border-rule bg-paper p-2 text-sm text-ink focus:border-ink focus:outline-none"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
        >
          {["generated", "provider", "licensed", "editorial"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <div className="flex items-center gap-2">
        <button
          disabled={busy}
          className="rounded border border-rule bg-paper px-3 py-1.5 text-xs font-semibold text-ink hover:border-ink transition-colors disabled:opacity-50"
        >
          {busy ? "Saving..." : "Save details"}
        </button>
        {message && (
          <p role="status" className="text-xs text-muted">
            {message}
          </p>
        )}
      </div>
    </form>
  );
}

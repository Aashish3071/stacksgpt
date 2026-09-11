"use client";
import { useState } from "react";
import Link from "next/link";
export function NewArticle() {
  const [message, setMessage] = useState("");
  return (
    <>
      <button
        className="bg-ink text-paper px-4 py-2"
        onClick={async () => {
          try {
            const r = await fetch("/api/newsroom/new-article", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: "{}",
            });
            const d = await r.json();
            if (!r.ok) throw Error(d.error);
            window.location.assign(`/admin/articles/${d.id}`);
          } catch (e) {
            setMessage(String(e));
          }
        }}
      >
        New article
      </button>
      <p role="status">{message}</p>
    </>
  );
}
export function LeadActions({ lead }: { lead: any }) {
  const [status, setStatus] = useState(lead.status);
  const [notes, setNotes] = useState(lead.notes || "");
  const [duplicateOf, setDuplicateOf] = useState(lead.duplicateOf || "");
  const [message, setMessage] = useState("");
  return (
    <div className="space-y-3">
      <select
        className="border p-2"
        aria-label="Lead status"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        {["PENDING", "SHORTLISTED", "IGNORED", "SELECTED"].map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
      <label className="block">
        Editorial notes
        <textarea
          className="border block w-full p-2"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      <label>
        Duplicate lead ID (optional)
        <input
          className="border block p-2"
          value={duplicateOf}
          onChange={(e) => setDuplicateOf(e.target.value)}
        />
      </label>
      <button
        className="border px-3 py-2"
        onClick={async () => {
          const r = await fetch("/api/newsroom/leads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: lead.id,
              status,
              notes,
              duplicateOf: duplicateOf || null,
            }),
          });
          const d = await r.json();
          setMessage(r.ok ? "Saved." : d.error);
        }}
      >
        Save decision
      </button>
      <p role="status">{message}</p>
    </div>
  );
}

"use client";
import { useState } from "react";
export default function MediaDetails({ asset }: { asset: any }) {
  const [alt, setAlt] = useState(asset.alt);
  const [credit, setCredit] = useState(asset.credit);
  const [origin, setOrigin] = useState(asset.origin);
  const [message, setMessage] = useState("");
  return (
    <form
      className="space-y-3 my-4"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          const r = await fetch("/api/newsroom/media-details", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: asset.id, alt, credit, origin }),
          });
          const b = await r.json();
          setMessage(r.ok ? "Media details saved." : b.error);
        } catch {
          setMessage("Could not save media details.");
        }
      }}
    >
      <label className="block">
        Image description
        <input
          className="block border p-2 w-full"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          required
        />
      </label>
      <label className="block">
        Credit
        <input
          className="block border p-2 w-full"
          value={credit}
          onChange={(e) => setCredit(e.target.value)}
          required
        />
      </label>
      <label className="block">
        Origin
        <select
          className="border p-2 ml-3"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
        >
          {["generated", "provider", "licensed", "editorial"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <button className="border px-4 py-2">Save image details</button>
      <p role="status">{message}</p>
    </form>
  );
}

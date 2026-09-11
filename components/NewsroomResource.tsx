"use client";
import Link from "next/link";
import { useState } from "react";
export default function NewsroomResource({
  section,
  rows,
  initial,
  fields,
}: {
  section: string;
  rows: any[];
  initial: any;
  fields: { key: string; label: string; type?: string; options?: string[] }[];
}) {
  const [form, setForm] = useState<any>(initial);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(payload: any = form) {
    setBusy(true);
    try {
      const r = await fetch(`/api/newsroom/${section}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setMessage("Saved.");
      window.location.reload();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_1fr]">
      <section>
        <h2 className="font-serif text-2xl mb-5">
          {form.id ? "Edit record" : "Add a record"}
        </h2>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          {fields.map((f) => (
            <label className="block" key={f.key}>
              <span>{f.label}</span>
              {f.type === "boolean" ? (
                <input
                  className="ml-3"
                  type="checkbox"
                  checked={!!form[f.key]}
                  onChange={(e) =>
                    setForm({ ...form, [f.key]: e.target.checked })
                  }
                />
              ) : f.options ? (
                <select
                  className="border block w-full p-3"
                  value={form[f.key] || ""}
                  onChange={(e) =>
                    setForm({ ...form, [f.key]: e.target.value })
                  }
                >
                  {f.options.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              ) : f.type === "json" ? (
                <textarea
                  key={form.id || "new"}
                  rows={6}
                  className="block border w-full p-3 font-mono text-sm"
                  defaultValue={JSON.stringify(form[f.key] ?? {}, null, 2)}
                  onBlur={(e) => {
                    try {
                      setForm({ ...form, [f.key]: JSON.parse(e.target.value) });
                      setMessage("");
                    } catch {
                      setMessage(`Invalid JSON in ${f.label}`);
                    }
                  }}
                />
              ) : (
                <textarea
                  rows={f.type === "long" ? 5 : 2}
                  className="block border w-full p-3"
                  value={form[f.key] ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, [f.key]: e.target.value })
                  }
                />
              )}
            </label>
          ))}
          <button
            disabled={busy || message.startsWith("Invalid JSON")}
            className="bg-ink text-paper px-5 py-3"
          >
            {busy ? "Saving…" : "Save"}
          </button>
          {form.id && (
            <button
              type="button"
              className="ml-4 underline"
              onClick={() => setForm(initial)}
            >
              New record
            </button>
          )}
          <p role="status" className="whitespace-pre-wrap text-accent">
            {message}
          </p>
        </form>
      </section>
      <section>
        <h2 className="font-serif text-2xl mb-5">Existing records</h2>
        {rows.map((row) => (
          <article key={row.id || row.key} className="border-b py-5">
            <h3 className="font-semibold">
              {row.name ||
                row.subject ||
                row.displayName ||
                row.label ||
                row.key ||
                row.id}
            </h3>
            <p className="text-sm my-2">
              {row.handleOrUrl ||
                row.url ||
                row.website ||
                row.email ||
                row.status ||
                row.description}
            </p>
            {row.lastError && (
              <p className="text-accent text-sm">{row.lastError}</p>
            )}
            {row.lastSuccessAt && (
              <p className="text-sm">
                Last successful fetch:{" "}
                {new Date(row.lastSuccessAt).toLocaleString()}
              </p>
            )}
            <button
              className="underline"
              onClick={() => {
                const value: any = {};
                for (const f of fields) value[f.key] = row[f.key];
                if (row.id) value.id = row.id;
                setForm(value);
              }}
            >
              Edit
            </button>
            {section === "newsletters" && (
              <Link
                className="ml-4 underline"
                href={`/admin/newsletters/${row.id}`}
              >
                Preview and delivery report
              </Link>
            )}
            {section === "newsletters" && row.status === "DRAFT" && (
              <button
                className="ml-5 underline"
                disabled={busy}
                onClick={() => {
                  if (
                    confirm(
                      "Queue this newsletter for all confirmed subscribers?",
                    )
                  )
                    void save({ id: row.id, action: "queue" });
                }}
              >
                Queue for delivery
              </button>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}

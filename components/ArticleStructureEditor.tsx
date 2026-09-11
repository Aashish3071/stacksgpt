"use client";
const list = (v: any): any[] => {
  try {
    const p = typeof v === "string" ? JSON.parse(v) : v;
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
};
const control = "block w-full border p-3 mt-2";
export default function ArticleStructureEditor({
  article: a,
  edit,
}: {
  article: any;
  edit: (key: string, value: any) => void;
}) {
  const arrays = [
    { key: "keyPoints", title: "Key points", fields: [], empty: "" },
    {
      key: "jargonBuster",
      title: "Terms explained",
      fields: [
        ["technicalTerm", "Term"],
        ["plainEnglish", "Plain-English explanation"],
      ],
      empty: { technicalTerm: "", plainEnglish: "" },
    },
    {
      key: "additionalSources",
      title: "Additional sources",
      fields: [
        ["name", "Source name"],
        ["url", "Original HTTPS link"],
        ["publishedAt", "Source publication time (UTC, optional)"],
        ["retrievedAt", "Retrieval time (UTC, optional)"],
      ],
      empty: { name: "", url: "" },
    },
    {
      key: "useCases",
      title: "Optional workflows",
      fields: [
        ["title", "Title"],
        ["targetAudience", "Audience"],
        ["stepByStep", "Steps (one per line)"],
        ["promptTemplate", "Optional prompt"],
      ],
      empty: { title: "", targetAudience: "", stepByStep: [] },
    },
  ];
  return (
    <div className="space-y-10">
      <p>
        Use optional workflows only when the reporting calls for them. News
        stories do not need tutorial blocks.
      </p>
      {arrays.map((group) => {
        const values = list(a[group.key]);
        const update = (next: any[]) =>
          edit(
            group.key,
            group.key === "additionalSources" ? next : JSON.stringify(next),
          );
        return (
          <section key={group.key}>
            <h2 className="font-serif text-2xl mb-3">{group.title}</h2>
            {values.map((item, i) => (
              <div key={i} className="border p-4 my-3 space-y-3">
                {group.key === "keyPoints" ? (
                  <label>
                    Point {i + 1}
                    <textarea
                      className={control}
                      value={item}
                      onChange={(e) =>
                        update(
                          values.map((x, j) => (j === i ? e.target.value : x)),
                        )
                      }
                    />
                  </label>
                ) : (
                  group.fields.map(([key, label]) => (
                    <label key={key} className="block">
                      {label}
                      <textarea
                        className={control}
                        rows={key === "stepByStep" ? 4 : 2}
                        value={
                          key === "stepByStep"
                            ? (item[key] || []).join("\n")
                            : item[key] || ""
                        }
                        onChange={(e) => {
                          const changed = { ...item };
                          if (
                            !e.target.value &&
                            [
                              "publishedAt",
                              "retrievedAt",
                              "promptTemplate",
                            ].includes(key)
                          )
                            delete changed[key];
                          else
                            changed[key] =
                              key === "stepByStep"
                                ? e.target.value.split("\n")
                                : e.target.value;
                          update(values.map((x, j) => (j === i ? changed : x)));
                        }}
                      />
                    </label>
                  ))
                )}
                <button
                  className="underline text-sm"
                  onClick={() => update(values.filter((_, j) => j !== i))}
                >
                  Remove {group.key === "keyPoints" ? "point" : "entry"}
                </button>
              </div>
            ))}
            <button
              className="border px-4 py-2"
              onClick={() => update([...values, group.empty])}
            >
              Add {group.key === "keyPoints" ? "point" : "entry"}
            </button>
          </section>
        );
      })}
      <section>
        <h2 className="font-serif text-2xl">Structured assessment</h2>
        {[
          ["whoShouldUse", "Who it suits"],
          ["limitations", "Limitations"],
          ["pricing", "Pricing"],
          ["recommendation", "Recommendation"],
        ].map(([key, label]) => (
          <label className="block my-4" key={key}>
            {label}
            <textarea
              className={control}
              value={a.structuredVerdict?.[key] || ""}
              onChange={(e) => {
                const v = { ...(a.structuredVerdict || {}) };
                if (e.target.value) v[key] = e.target.value;
                else delete v[key];
                edit("structuredVerdict", v);
              }}
            />
          </label>
        ))}
      </section>
    </div>
  );
}

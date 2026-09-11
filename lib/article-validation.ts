import {
  structuredVerdictSchema,
  additionalSourcesSchema,
  jargonSchema,
  workflowSchema,
} from "./structured-content";
import { editorialErrors } from "./editorial-rules";
export function publicationErrors(a: any, now = new Date()): string[] {
  // Shared editorial rules: lengths, house style, key points, taxonomy, search
  // limits, attribution, timestamps and imagery. Identical for MDX imports and
  // newsroom edits, so an article cannot be valid through one door and invalid
  // through the other.
  const errors: string[] = editorialErrors(
    {
      title: a.title,
      summary: a.summary,
      verdict: a.verdict,
      body: a.body,
      keyPoints: parseList(a.keyPoints),
      slug: a.slug,
      type: a.type,
      category: a.category,
      seoTitle: a.seoTitle,
      metaDescription: a.metaDescription,
      sourceAuthor: a.sourceAuthor,
      sourceUrl: a.sourceUrl,
      sourcePublishedAt: a.sourcePublishedAt,
      retrievedAt: a.retrievedAt,
      heroImage: a.heroImage,
      heroImageAlt: a.heroImageAlt,
      heroImageCredit: a.heroImageCredit,
    },
    now,
  );

  // --- Checks specific to a stored record, not to the copy itself ---------
  if (!a.authorId) errors.push("Choose an author.");

  // The hero image must be a committed file or an upload in our own storage,
  // never an arbitrary remote URL.
  if (
    !/^\/images\/articles\/[a-zA-Z0-9_-]+\.(png|jpe?g|webp|avif)$/.test(
      a.heroImage || "",
    ) &&
    !a.heroImage?.startsWith(
      `${process.env.SUPABASE_URL}/storage/v1/object/public/article-media/`,
    )
  )
    errors.push("Choose a committed or uploaded hero image.");

  if (
    !["generated", "provider", "licensed", "editorial"].includes(
      a.heroImageOrigin,
    )
  )
    errors.push("Choose the image origin.");

  for (const [key, schema] of [
    ["structuredVerdict", structuredVerdictSchema],
    ["additionalSources", additionalSourcesSchema],
    ["jargonBuster", jargonSchema],
    ["useCases", workflowSchema],
  ] as const) {
    try {
      const v = typeof a[key] === "string" ? JSON.parse(a[key]) : a[key];
      if (v !== null && v !== undefined) schema.parse(v);
    } catch {
      errors.push(`Invalid structure in ${key}.`);
    }
  }
  if (Array.isArray(a.additionalSources))
    for (const s of a.additionalSources) {
      for (const k of ["publishedAt", "retrievedAt"])
        if (s[k] && new Date(s[k]) > now)
          errors.push("Additional source dates cannot be in the future.");
      if (
        s.publishedAt &&
        s.retrievedAt &&
        new Date(s.publishedAt) > new Date(s.retrievedAt)
      )
        errors.push("Additional source retrieval cannot precede publication.");
    }
  return errors;
}
/** Key points may arrive as an array or as a JSON string, depending on caller. */
function parseList(value: unknown): string[] {
  try {
    const v = typeof value === "string" ? JSON.parse(value) : value;
    return Array.isArray(v) ? v.map((x) => String(x ?? "")) : [];
  } catch {
    return [];
  }
}

export function editableFields(input: any) {
  const strings = [
    "slug",
    "title",
    "summary",
    "verdict",
    "category",
    "body",
    "sourceAuthor",
    "sourceUrl",
    "heroImage",
    "heroImageAlt",
    "heroImageCredit",
    "heroImageOrigin",
    "type",
    "seoTitle",
    "metaDescription",
    "correctionNote",
    "authorId",
  ];
  const out: any = {};
  for (const k of strings)
    if (input[k] !== undefined) {
      if (
        input[k] === null &&
        ![
          "slug",
          "title",
          "summary",
          "verdict",
          "category",
          "type",
          "heroImageOrigin",
        ].includes(k)
      ) {
        out[k] = null;
        continue;
      }
      if (typeof input[k] !== "string" || input[k].length > 150000)
        throw Error(`Invalid ${k}`);
      out[k] = input[k].trim();
    }
  for (const k of ["tags", "audiences"])
    if (input[k] !== undefined) {
      if (
        !Array.isArray(input[k]) ||
        input[k].length > 30 ||
        input[k].some(
          (x: any) => typeof x !== "string" || !/^[a-z0-9-]{1,70}$/.test(x),
        )
      )
        throw Error(`Invalid ${k}`);
      out[k] = input[k];
    }
  for (const k of ["keyPoints", "jargonBuster", "useCases", "keywords"])
    if (input[k] !== undefined) {
      const value =
        input[k] === null
          ? []
          : typeof input[k] === "string"
            ? JSON.parse(input[k])
            : input[k];
      if (!Array.isArray(value)) throw Error(`${k} must be a list`);
      out[k] = JSON.stringify(value);
    }
  for (const k of ["structuredVerdict", "additionalSources"])
    if (input[k] !== undefined) out[k] = input[k];
  for (const k of ["sourcePublishedAt", "retrievedAt"])
    if (input[k] !== undefined) {
      const d = input[k] ? new Date(input[k]) : null;
      if (d && !Number.isFinite(d.getTime())) throw Error(`Invalid ${k}`);
      out[k] = d;
    }
  for (const k of ["featured", "editorsPick"])
    if (input[k] !== undefined) out[k] = Boolean(input[k]);
  return out;
}
export const snapshot = (a: any) => JSON.parse(JSON.stringify(a));
export function canTransition(status: string, action: string) {
  return action === "review"
    ? ["DRAFT", "NEEDS_EDIT", "REJECTED"].includes(status)
    : action === "approve"
      ? status === "IN_REVIEW"
      : action === "publish"
        ? ["APPROVED", "SCHEDULED"].includes(status)
        : action === "schedule"
          ? status === "APPROVED"
          : ["draft", "archive", "reject"].includes(action);
}

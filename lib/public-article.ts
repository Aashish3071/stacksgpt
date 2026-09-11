// Only this projection may cross a public Server Component -> Client Component boundary.
export function publicArticle(a: any) {
  const keys = [
    "id",
    "slug",
    "title",
    "summary",
    "verdict",
    "category",
    "type",
    "keyPoints",
    "body",
    "jargonBuster",
    "useCases",
    "readingMinutes",
    "publishedAt",
    "updatedAt",
    "sourceAuthor",
    "sourceUrl",
    "sourcePublishedAt",
    "heroImage",
    "heroImageAlt",
    "heroImageCredit",
    "heroImageOrigin",
    "primaryTool",
    "correctionNote",
    "structuredVerdict",
    "additionalSources",
    "tags",
    "audiences",
  ];
  const res = Object.fromEntries(
    keys.map((k) => [
      k,
      k === "updatedAt" ? a.publishedUpdatedAt || a.publishedAt : a[k],
    ]),
  ) as any;

  if ((!res.tags || res.tags.length === 0) && a.keywords) {
    try {
      const parsed =
        typeof a.keywords === "string" ? JSON.parse(a.keywords) : a.keywords;
      if (Array.isArray(parsed)) {
        res.tags = parsed
          .map((k: string) =>
            String(k)
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, ""),
          )
          .filter((t: string) => Boolean(t) && /^[a-z0-9-]{1,70}$/.test(t));
      }
    } catch {}
  }
  return res;
}

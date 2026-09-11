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
  return Object.fromEntries(
    keys.map((k) => [
      k,
      k === "updatedAt" ? a.publishedUpdatedAt || a.publishedAt : a[k],
    ]),
  ) as any;
}

import { parseArticleText, ParsedArticle } from "./content";
import { publicationErrors } from "./article-validation";
import { verifyHeroImage } from "./media-validation";
import { saveDraft } from "./editorial";
import prisma from "./db";
export function importFields(a: ParsedArticle) {
  return {
    tags: a.tags,
    audiences: a.audiences,
    structuredVerdict: a.structuredVerdict,
    additionalSources: a.additionalSources,
    heroImageOrigin: a.heroImageOrigin,
    externalId: a.externalId,
    sourceHash: a.sourceHash,
    slug: a.slug,
    title: a.title,
    summary: a.summary,
    verdict: a.verdict,
    category: a.category,
    type: a.type,
    keyPoints: a.keyPoints,
    jargonBuster: a.jargonBuster,
    useCases: a.useCases,
    body: a.body,
    sourceAuthor: a.sourceName,
    sourceUrl: a.sourceUrl,
    sourcePublishedAt: a.sourcePublishedAt,
    retrievedAt: a.retrievedAt,
    heroImage: a.heroImage,
    heroImageAlt: a.heroImageAlt,
    heroImageCredit: a.heroImageCredit,
    seoTitle: a.seoTitle,
    metaDescription: a.metaDescription,
    keywords: a.keywords,
  };
}
export async function processImport(
  raw: string,
  fileName: string,
  { dry = false, local = true } = {},
) {
  let externalId = fileName.replace(/\.mdx?$/, "");
  try {
    const result = parseArticleText(raw, fileName, { checkLocalFiles: local });
    if (!result.ok) throw Error(result.failure.errors.join("\n"));
    const fields = importFields(result.article);
    externalId = fields.externalId;
    const errors = publicationErrors({
      ...fields,
      authorId: "pending-editor-assignment",
    });
    if (errors.length) throw Error(errors.join("\n"));
    const image = await verifyHeroImage(fields.heroImage!, {
      localRequired: local,
    });
    if (dry) return { externalId, status: "VALID" };
    const asset = await prisma.mediaAsset.findUnique({
      where: { url: fields.heroImage! },
    });
    if (asset?.contentHash && asset.contentHash !== image.contentHash)
      throw Error(
        "An existing image was overwritten. Use a new versioned image filename so published articles keep their approved image.",
      );
    if (!asset)
      await prisma.mediaAsset.create({
        data: {
          url: fields.heroImage!,
          alt: fields.heroImageAlt!,
          credit: fields.heroImageCredit!,
          origin: fields.heroImageOrigin,
          createdBy: "antigravity",
          ...image,
        },
      });
    const before = await prisma.article.findUnique({
      where: { externalId },
      select: { sourceHash: true, pendingHash: true },
    });
    const article = await saveDraft(fields, null, true);
    const status =
      before && (before.pendingHash || before.sourceHash) === fields.sourceHash
        ? "UNCHANGED"
        : "DRAFT";
    if (status !== "UNCHANGED")
      await prisma.importAttempt.create({
        data: { externalId, status, errors: [] },
      });
    return {
      externalId,
      id: article.id,
      status: article.pendingStatus || article.status,
      unchanged: status === "UNCHANGED",
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Import failed.";
    if (!dry)
      await prisma.importAttempt
        .create({
          data: { externalId, status: "REJECTED", errors: message.split("\n") },
        })
        .catch(() => {});
    throw Error(message);
  }
}

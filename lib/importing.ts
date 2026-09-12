import { parseArticleText, ParsedArticle } from "./content";
import { publicationErrors } from "./article-validation";
import { verifyHeroImage } from "./media-validation";
import { saveDraft } from "./editorial";
import prisma from "./db";

/**
 * Registers any tag or audience an imported article uses but the Taxonomy
 * table does not yet know about.
 *
 * transitionArticle() refuses to move an article out of DRAFT unless every one
 * of its tags and audiences already exists as an *active* Taxonomy row, and
 * the writing agent invents a tag or two per article. The result was that a
 * freshly imported article could not even be sent to review: the very first
 * transition failed with "Choose active tags and audiences.", which does not
 * say which tag is missing, so the only way to publish was to pre-create the
 * rows by hand. Registering them at the point of import removes that dead end.
 *
 * The slug is used verbatim (it is already validated on the way in) and the
 * name is derived from it for display. An existing row is left completely
 * alone, so an editor who has deliberately deactivated a tag keeps that
 * decision.
 */
/**
 * Picks the byline for an imported article.
 *
 * saveDraft() falls back to `authorId: fields.authorId || actorId`, and an
 * import has no acting user, so every imported article arrived with no author
 * at all. publicationErrors() then refuses to let it leave DRAFT with "Choose
 * an author." — meaning a freshly written article could never be approved
 * without someone opening it and picking an author by hand first.
 *
 * DEFAULT_AUTHOR_EMAIL names the byline explicitly; otherwise the oldest
 * active administrator is used so the choice is stable rather than whichever
 * row the database happens to return first. Returning null is fine: the
 * existing validation still catches it and says so.
 */
async function defaultAuthorId(): Promise<string | null> {
  const preferred = process.env.DEFAULT_AUTHOR_EMAIL?.trim().toLowerCase();
  if (preferred) {
    const named = await prisma.profile.findFirst({
      where: { email: preferred, active: true },
      select: { id: true },
    });
    if (named) return named.id;
    console.warn(
      `DEFAULT_AUTHOR_EMAIL is set to "${preferred}" but no active profile matches it.`,
    );
  }
  const admin = await prisma.profile.findFirst({
    where: { active: true, role: "ADMIN" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (admin) return admin.id;
  const anyEditor = await prisma.profile.findFirst({
    where: { active: true },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return anyEditor?.id ?? null;
}

async function registerTaxonomy(fields: { tags?: string[]; audiences?: string[] }) {
  const entries: { kind: string; slug: string }[] = [
    ...(fields.tags || []).map((slug) => ({ kind: "TAG", slug })),
    ...(fields.audiences || []).map((slug) => ({ kind: "AUDIENCE", slug })),
  ];
  for (const { kind, slug } of entries) {
    if (!slug) continue;
    const name = slug
      .split("-")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
    try {
      await prisma.taxonomy.upsert({
        where: { kind_slug: { kind, slug } },
        create: { kind, slug, name, active: true },
        update: {},
      });
    } catch (e) {
      // A taxonomy row failing to register should not fail the whole import;
      // the article is still saved and the transition will name what is wrong.
      console.warn(`Could not register ${kind} "${slug}":`, e);
    }
  }
}
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
    const publishedOwner = await prisma.article.findFirst({
      where: { heroImage: fields.heroImage!, isPublished: true },
    });
    if (publishedOwner && asset?.contentHash && asset.contentHash !== image.contentHash)
      throw Error(
        "An existing image was overwritten. Use a new versioned image filename so published articles keep their approved image.",
      );
    if (!asset) {
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
    } else if (asset.contentHash !== image.contentHash && !publishedOwner) {
      await prisma.mediaAsset.update({
        where: { id: asset.id },
        data: {
          contentHash: image.contentHash,
          width: image.width,
          height: image.height,
          byteSize: image.byteSize,
          alt: fields.heroImageAlt!,
          credit: fields.heroImageCredit!,
        },
      });
    }
    const before = await prisma.article.findUnique({
      where: { externalId },
      select: {
        sourceHash: true,
        pendingHash: true,
        isPublished: true,
        heroImage: true,
        authorId: true,
      },
    });
    // Only fill in a byline when the article does not already name one, and
    // never overwrite the author on an article an editor has already touched.
    const authorId =
      (fields as { authorId?: string }).authorId ||
      before?.authorId ||
      (await defaultAuthorId());
    const article = await saveDraft({ ...fields, authorId }, null, true);
    await registerTaxonomy(fields);
    if (before?.isPublished && fields.heroImage && fields.heroImage !== before.heroImage) {
      await prisma.article.update({
        where: { id: article.id },
        data: {
          heroImage: fields.heroImage,
          heroImageAlt: fields.heroImageAlt,
          heroImageCredit: fields.heroImageCredit,
        },
      });
    }
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

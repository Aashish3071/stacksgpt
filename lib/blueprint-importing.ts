import prisma from "./db";
import { parseBlueprintText } from "./blueprint-content";

export async function processBlueprintImport(
  raw: string,
  fileName: string,
  options: { dry?: boolean } = {},
) {
  const result = parseBlueprintText(raw, fileName, { checkLocalFiles: true });
  if (!result.ok) {
    throw new Error(result.failure.errors.join("; "));
  }
  const bp = result.blueprint;
  if (options.dry) {
    return { unchanged: false, externalId: bp.externalId };
  }

  const existing = await prisma.blueprint.findUnique({
    where: { externalId: bp.externalId },
    select: { id: true, sourceHash: true, isPublished: true },
  });

  if (existing && existing.sourceHash === bp.sourceHash) {
    return { unchanged: true, externalId: bp.externalId };
  }

  await prisma.blueprint.upsert({
    where: { externalId: bp.externalId },
    create: {
      externalId: bp.externalId,
      slug: bp.slug,
      title: bp.title,
      summary: bp.summary,
      outcome: bp.outcome,
      goal: bp.goal,
      category: bp.category,
      roles: bp.roles,
      tools: bp.tools,
      difficulty: bp.difficulty,
      setupTime: bp.setupTime,
      costNotes: bp.costNotes,
      freeBody: bp.freeBody,
      gatedBody: bp.gatedBody,
      references: bp.references as any,
      heroImage: bp.heroImage,
      heroImageAlt: bp.heroImageAlt,
      seoTitle: bp.seoTitle,
      metaDescription: bp.metaDescription,
      keywords: bp.keywords,
      sourceHash: bp.sourceHash,
      status: "PUBLISHED",
      isPublished: true,
      publishedAt: new Date(),
    },
    update: {
      slug: bp.slug,
      title: bp.title,
      summary: bp.summary,
      outcome: bp.outcome,
      goal: bp.goal,
      category: bp.category,
      roles: bp.roles,
      tools: bp.tools,
      difficulty: bp.difficulty,
      setupTime: bp.setupTime,
      costNotes: bp.costNotes,
      freeBody: bp.freeBody,
      gatedBody: bp.gatedBody,
      references: bp.references as any,
      heroImage: bp.heroImage,
      heroImageAlt: bp.heroImageAlt,
      seoTitle: bp.seoTitle,
      metaDescription: bp.metaDescription,
      keywords: bp.keywords,
      sourceHash: bp.sourceHash,
      updatedContentAt: new Date(),
    },
  });

  return { unchanged: false, externalId: bp.externalId };
}

import {REVIEW_CHECKS} from "./review-checks";
import prisma from "./db";
import { verifyHeroImage } from "./media-validation";
import {
  editableFields,
  publicationErrors,
  snapshot,
  canTransition,
} from "./article-validation";
export async function saveDraft(
  input: any,
  actorId: string | null,
  external = false,
) {
  const fields = editableFields(input);
  if (fields.body)
    fields.readingMinutes = Math.max(
      1,
      Math.ceil(fields.body.split(/\s+/).length / 200),
    );
  return prisma.$transaction(async (tx) => {
    const existing = input.id
      ? await tx.article.findUnique({ where: { id: input.id } })
      : input.externalId
        ? await tx.article.findUnique({
            where: { externalId: input.externalId },
          })
        : null;
    if (existing) {
      await tx.$queryRaw`SELECT id FROM "Article" WHERE id=${existing.id} FOR UPDATE`;
      const current = await tx.article.findUniqueOrThrow({
        where: { id: existing.id },
      });
      if (
        (!external && input.version === undefined) ||
        (input.version !== undefined && input.version !== current.version)
      )
        throw Error(
          "This draft changed since you opened it. Refresh before saving.",
        );
      if (
        external &&
        (current.pendingHash || current.sourceHash) === input.sourceHash
      )
        return current;
      const next = current.isPublished
        ? {
            ...snapshot(current),
            ...((current.pendingDraft as any) || {}),
            ...snapshot(fields),
          }
        : fields;
      await tx.articleRevision.create({
        data: {
          articleId: current.id,
          version: current.version,
          snapshot: snapshot(current),
          actorId,
        },
      });
      const updated = await tx.article.update({
        where: { id: current.id },
        data: current.isPublished
          ? {
              pendingDraft: next,
              pendingStatus: "DRAFT",
              pendingHash: external ? input.sourceHash : current.pendingHash,
              approvedAt: null,
              reviewedBy: null,
              version: { increment: 1 },
            }
          : {
              ...fields,
              status: "DRAFT",
              isPublished: false,
              approvedAt: null,
              reviewedBy: null,
              scheduledFor: null,
              version: { increment: 1 },
              ...(external ? { sourceHash: input.sourceHash } : {}),
            },
      });
      await tx.auditLog.create({
        data: {
          actorId,
          action: external ? "DRAFT_IMPORTED" : "DRAFT_EDITED",
          articleId: current.id,
        },
      });
      return updated;
    }
    const created = await tx.article.create({
      data: {
        slug: fields.slug || `draft-${crypto.randomUUID()}`,
        title: fields.title || "Untitled draft",
        summary: "",
        verdict: "",
        jargonBuster: "[]",
        useCases: "[]",
        ...fields,
        externalId: input.externalId || null,
        sourceHash: external ? input.sourceHash : null,
        origin: external ? "ANTIGRAVITY" : "EDITOR",
        status: "DRAFT",
        isPublished: false,
        authorId: actorId,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId,
        action: external ? "DRAFT_IMPORTED" : "DRAFT_CREATED",
        articleId: created.id,
      },
    });
    return created;
  });
}
export async function transitionArticle(
  id: string,
  action: string,
  actorId: string,
  version: number,
  when?: string,
  reason?: string,
  checks?:Record<string,boolean>,
) {
  return prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Article" WHERE id=${id} FOR UPDATE`;
      const a = await tx.article.findUniqueOrThrow({ where: { id } });
      if (a.version !== version)
        throw Error(
          "The article changed. Refresh and review its current version.",
        );
      const status = a.pendingStatus || a.status;
      if (!canTransition(status, action))
        throw Error(`Cannot ${action} an article in ${status}.`);
      if (
        action === "publish" &&
        status === "SCHEDULED" &&
        (!a.scheduledFor || a.scheduledFor > new Date())
      )
        throw Error("This article is not due for publication yet.");
      if(action==="approve"&&REVIEW_CHECKS.some(([key])=>checks?.[key]!==true))throw Error("Complete every human review check before approving this version.");
      const candidate = { ...a, ...((a.pendingDraft as any) || {}) };
      if (["review", "approve", "publish", "schedule"].includes(action)) {
        const errors = publicationErrors(candidate);
        if (errors.length) throw Error(errors.join("\n"));
        const category = await tx.taxonomy.findFirst({
          where: { kind: "CATEGORY", name: candidate.category, active: true },
        });
        if (!category) throw Error("Choose an active category.");
        for (const [kind, slugs] of [
          ["TAG", candidate.tags],
          ["AUDIENCE", candidate.audiences],
        ] as const) {
          if (
            slugs?.length &&
            (await tx.taxonomy.count({
              where: { kind, slug: { in: slugs }, active: true },
            })) !== slugs.length
          )
            throw Error("Choose active tags and audiences.");
        }
        const image = await verifyHeroImage(candidate.heroImage);
        const knownImage = await tx.mediaAsset.findUnique({
          where: { url: candidate.heroImage },
        });
        if (
          knownImage?.contentHash &&
          knownImage.contentHash !== image.contentHash
        )
          throw Error(
            "This image changed at an existing URL. Save it under a new filename and submit for review.",
          );
        if (!knownImage)
          await tx.mediaAsset.create({
            data: {
              url: candidate.heroImage,
              alt: candidate.heroImageAlt,
              credit: candidate.heroImageCredit,
              origin: candidate.heroImageOrigin,
              createdBy: actorId,
              ...image,
            },
          });
        const author = await tx.profile.findUnique({
          where: { id: candidate.authorId },
        });
        if (!author?.active) throw Error("Choose an active author.");
      }
      if (
        ["publish", "schedule"].includes(action) &&
        (!a.reviewedBy ||
          !a.approvedAt ||
          !(await tx.profile.findUnique({ where: { id: a.reviewedBy } }))
            ?.active)
      )
        throw Error("A human must approve this exact version first.");
      if (
        action === "schedule" &&
        (!when ||
          !Number.isFinite(new Date(when).getTime()) ||
          new Date(when) <= new Date())
      )
        throw Error("Select a future publication time.");
      if (action === "reject" && (!reason || reason.length < 5))
        throw Error("Add a rejection reason.");
      await tx.articleRevision.create({
        data: {
          articleId: id,
          version: a.version,
          snapshot: snapshot(a),
          actorId,
        },
      });
      let data: any = { version: { increment: 1 } };
      if (action === "publish") {
        const sourceSlug = candidate.sourceAuthor
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        await tx.taxonomy.upsert({
          where: { kind_slug: { kind: "SOURCE", slug: sourceSlug } },
          create: {
            kind: "SOURCE",
            slug: sourceSlug,
            name: candidate.sourceAuthor,
          },
          update: {},
        });
        const fields = editableFields(candidate);
        const reserved = await tx.articleRedirect.findUnique({
          where: { slug: fields.slug },
        });
        if (reserved && reserved.articleId !== id)
          throw Error("This URL is reserved by another article.");
        if (fields.slug !== a.slug) {
          const used = await tx.articleRedirect.findUnique({
            where: { slug: fields.slug },
          });
          if (used && used.articleId !== id)
            throw Error("This slug belongs to an earlier article.");
          await tx.articleRedirect.upsert({
            where: { slug: a.slug },
            create: { slug: a.slug, articleId: id },
            update: { articleId: id },
          });
        }
        data = {
          ...data,
          ...fields,
          readingMinutes:Math.max(1,Math.ceil((fields.body||"").split(/\s+/).length/200)),
          status: "PUBLISHED",
          isPublished: true,
          publishedAt: fields.publishedAt
            ? new Date(fields.publishedAt)
            : a.status === "PUBLISHED"
              ? a.publishedAt || new Date()
              : new Date(),
          publishedUpdatedAt: new Date(),
          pendingDraft: null,
          pendingStatus: null,
          pendingHash: null,
          sourceHash: a.pendingHash || a.sourceHash,
          scheduledFor: null,
          rejectionReason: null,
        };
      } else if (action === "archive" || action === "draft") {
        data = {
          ...data,
          isPublished: false,
          status: action === "archive" ? "ARCHIVED" : "DRAFT",
          pendingStatus: null,
          pendingDraft: null,
          pendingHash: null,
          sourceHash: a.pendingHash || a.sourceHash,
          scheduledFor: null,
          approvedAt: null,
          reviewedBy: null,
          ...(a.pendingDraft ? editableFields(a.pendingDraft) : {}),
        };
      } else {
        const next = (
          {
            review: "IN_REVIEW",
            approve: "APPROVED",
            schedule: "SCHEDULED",
            reject: "REJECTED",
          } as any
        )[action];
        data[a.pendingDraft ? "pendingStatus" : "status"] = next;
        if (action === "approve") {
          data.approvedAt = new Date();
          data.reviewedBy = actorId;
        }
        if (action === "schedule") data.scheduledFor = new Date(when!);
        if (action === "reject") {
          data.rejectionReason = reason;
          data.approvedAt = null;
          data.reviewedBy = null;
          data.scheduledFor = null;
        }
      }
      const updated = await tx.article.update({ where: { id }, data });
      await tx.auditLog.create({
        data: {
          actorId,
          action: action.toUpperCase(),
          articleId: id,
          detail: { from: status, to: data.status || data.pendingStatus, ...(action==="approve"?{checks}: {}) },
        },
      });
      return updated;
    },
    { timeout: 20000 },
  );
}

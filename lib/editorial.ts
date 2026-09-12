import {REVIEW_CHECKS} from "./review-checks";
import prisma from "./db";
import { verifyHeroImage } from "./media-validation";
import { draftSocialPost } from "./social";
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
      if (!fields.authorId && !current.authorId && actorId && !external) {
        fields.authorId = actorId;
      }
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
        authorId: fields.authorId || actorId,
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
  // Set inside the transaction below, read after it commits. Deliberately not
  // acted on inside the transaction itself: a Postgres transaction aborts on
  // the first error and refuses every later statement until rollback, so a
  // missing SocialPost table (or any other drafting failure) would silently
  // take the actual article-publish update down with it. Drafting a social
  // post is a side effect of publishing, not a requirement for it.
  let firstPublish = false;
  const updated = await prisma.$transaction(
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
      firstPublish = action === "publish" && a.status !== "PUBLISHED";
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
          if (!slugs?.length) continue;
          const active = await tx.taxonomy.findMany({
            where: { kind, slug: { in: slugs }, active: true },
            select: { slug: true },
          });
          if (active.length !== slugs.length) {
            // Name the offending slugs. This used to read "Choose active tags
            // and audiences.", which gave an editor no way to tell which of an
            // article's tags was the problem, and it fires on the very first
            // transition, so it read as "publishing is broken".
            const known = new Set(active.map((t) => t.slug));
            const missing = slugs.filter((s: string) => !known.has(s));
            throw Error(
              `These ${kind.toLowerCase()}s are not active in the taxonomy: ${missing.join(", ")}. Add them under ${kind === "TAG" ? "Tags" : "Audiences"}, or remove them from the article.`,
            );
          }
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
      const reviewer = a.reviewedBy
        ? a.reviewedBy === "master-admin"
          ? { active: true }
          : await tx.profile.findUnique({ where: { id: a.reviewedBy } })
        : null;
      if (
        ["publish", "schedule"].includes(action) &&
        (!a.reviewedBy || !a.approvedAt || !reviewer?.active)
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
  if (firstPublish) {
    // Outside the transaction and on the plain client, deliberately: this
    // must never be able to take the publish itself down (see the comment
    // where firstPublish is declared). A failure here — table not migrated
    // yet, or any other issue — is logged and otherwise swallowed; the
    // article is already published either way.
    for (const platform of ["X", "LINKEDIN"] as const) {
      try {
        await draftSocialPost(prisma, updated, platform);
      } catch (e) {
        console.warn(
          `Could not draft a ${platform} post for ${updated.id}:`,
          e instanceof Error ? e.message : e,
        );
      }
    }
  }
  return updated;
}

import { requireSecret, rateLimit, limitedJson } from "@/lib/security";
import { socialBodyError } from "@/lib/social";
import prisma from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

/**
 * Inbound endpoint for externally-written social copy.
 *
 * The articles are written by one agent and the social posts by another, so
 * this is the seam between them: the writer POSTs finished copy for a
 * published article and it lands in the same PENDING_APPROVAL queue the
 * auto-drafter uses. Nothing here sends anything — an editor still approves
 * each post in /admin/social-posts, exactly as before.
 *
 * Re-posting for the same article and platform replaces the copy, so the
 * writer can revise a draft. Once a post has been sent it is left alone:
 * rewriting the body of something already public would make the record lie
 * about what was actually posted.
 */
const payload = z.object({
  slug: z.string().min(1).max(200),
  platform: z.enum(["X", "LINKEDIN"]),
  body: z.string().min(1).max(3000),
  imageUrl: z.string().url().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    requireSecret(req, "INGEST_SECRET");
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await rateLimit(req, "import-social", 40);
    const input = payload.parse(await limitedJson(req, 20000));

    const lengthError = socialBodyError(input.platform, input.body);
    if (lengthError) return Response.json({ error: lengthError }, { status: 422 });

    const article = await prisma.article.findUnique({
      where: { slug: input.slug },
      select: { id: true, isPublished: true, heroImage: true },
    });
    if (!article)
      return Response.json(
        { error: `No article exists with slug "${input.slug}".` },
        { status: 404 },
      );
    if (!article.isPublished)
      return Response.json(
        {
          error:
            "That article is not published yet. Social copy is only accepted for live articles.",
        },
        { status: 409 },
      );

    const existing = await prisma.socialPost.findFirst({
      where: { articleId: article.id, platform: input.platform },
    });

    if (existing && ["SENT", "SENDING"].includes(existing.status))
      return Response.json(
        {
          error: `This ${input.platform} post has already been ${existing.status.toLowerCase()}; it cannot be rewritten.`,
          id: existing.id,
          status: existing.status,
        },
        { status: 409 },
      );

    const data = {
      body: input.body,
      imageUrl: input.imageUrl ?? article.heroImage ?? null,
      // Any revision returns the post to the queue for a fresh human read,
      // even if it had already been approved.
      status: "PENDING_APPROVAL",
      approvedBy: null,
      approvedAt: null,
      error: null,
    };

    const post = existing
      ? await prisma.socialPost.update({ where: { id: existing.id }, data })
      : await prisma.socialPost.create({
          data: { articleId: article.id, platform: input.platform, ...data },
        });

    return Response.json(
      { id: post.id, platform: post.platform, status: post.status },
      { status: existing ? 200 : 201 },
    );
  } catch (e) {
    if (e instanceof z.ZodError)
      return Response.json(
        {
          error: e.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; "),
        },
        { status: 422 },
      );
    // Validation problems are the caller's to fix and are returned above.
    // Anything reaching here is ours — a missing table, a dropped connection —
    // so report it as such and keep the detail in the logs rather than
    // echoing schema internals back over the wire.
    const detail = e instanceof Error ? e.message : String(e);
    console.error("Social import failed:", detail);
    return Response.json(
      { error: "Could not store the post. Check the server logs." },
      { status: 500 },
    );
  }
}

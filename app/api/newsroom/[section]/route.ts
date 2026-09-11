import { imageDetails } from "@/lib/media-validation";
import { revalidatePath } from "next/cache";
import { editor, admin, supabase } from "@/lib/editor-auth";
import prisma from "@/lib/db";
import { limitedJson, publicUrl, sameOrigin } from "@/lib/security";
import { saveDraft } from "@/lib/editorial";
import { emailConfigured } from "@/lib/newsletter";
import { getSettings } from "@/lib/settings";
import { z } from "zod";
export const dynamic = "force-dynamic";
const name = z.string().trim().min(2).max(160);
const url = z.string().refine(publicUrl, "Use a public HTTPS URL.");
const slug = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  .max(70);
export async function POST(
  req: Request,
  { params }: { params: Promise<{ section: string }> },
) {
  try {
    sameOrigin(req);
    const p = await editor();
    const section = (await params).section;
    if (section === "media") {
      const size = Number(req.headers.get("content-length") || 0);
      if (!size || size > 4200000) throw Error("Upload an image under 4 MB.");
      const f = await req.formData();
      const file = f.get("file");
      if (!(file instanceof File) || file.size > 4000000)
        throw Error("Image missing or too large.");
      const ext = (
        {
          "image/png": "png",
          "image/jpeg": "jpg",
          "image/webp": "webp",
          "image/avif": "avif",
        } as any
      )[file.type];
      if (!ext) throw Error("Use PNG, JPEG, WebP, or AVIF.");
      const bytes = new Uint8Array(await file.arrayBuffer());
      const magic =
        ext === "png"
          ? bytes[0] === 137 && bytes[1] === 80
          : ext === "jpg"
            ? bytes[0] === 255 && bytes[1] === 216
            : ext === "webp"
              ? Buffer.from(bytes.slice(8, 12)).toString() === "WEBP"
              : Buffer.from(bytes.slice(4, 12))
                  .toString()
                  .startsWith("ftypavif");
      if (!magic) throw Error("Invalid image file.");
      const imageInfo = await imageDetails(bytes);
      const path = `${p.id}/${crypto.randomUUID()}.${ext}`;
      const client = supabase(p.token);
      const { error } = await client.storage
        .from("article-media")
        .upload(path, bytes, { contentType: file.type, upsert: false });
      if (error)
        throw Error("Upload failed. Check the media bucket configuration.");
      const imageUrl = client.storage.from("article-media").getPublicUrl(path)
        .data.publicUrl;
      await prisma.mediaAsset.create({
        data: {
          url: imageUrl,
          alt: String(f.get("alt") || "").slice(0, 500),
          credit: String(f.get("credit") || "").slice(0, 300),
          origin: "editorial",
          createdBy: p.id,
          width: imageInfo.width,
          height: imageInfo.height,
          byteSize: bytes.length,
        },
      });
      return Response.json({ url: imageUrl });
    }
    const b = await limitedJson(req);
    if (section === "media-details") {
      const v = z
        .object({
          id: z.string(),
          alt: z.string().min(5).max(500),
          credit: z.string().min(3).max(300),
          origin: z.enum(["generated", "provider", "licensed", "editorial"]),
        })
        .parse(b);
      const { id, ...data } = v;
      await prisma.mediaAsset.update({ where: { id }, data });
      return Response.json({ ok: true });
    }
    if (section === "leads") {
      const v = z
        .object({
          id: z.string(),
          status: z.enum(["PENDING", "SHORTLISTED", "IGNORED", "SELECTED"]),
          notes: z.string().max(5000).default(""),
          duplicateOf: z.string().nullable().optional(),
        })
        .parse(b);
      if (v.duplicateOf === v.id)
        throw Error("A lead cannot duplicate itself.");
      const lead = await prisma.rawNews.update({
        where: { id: v.id },
        data: { status: v.status, notes: v.notes, duplicateOf: v.duplicateOf },
      });
      return Response.json({ ok: true, lead });
    }
    if (section === "new-article") {
      const a = await saveDraft({}, p.id);
      return Response.json({ id: a.id });
    }
    await admin();
    let result: any;
    if (section === "sources") {
      const v = z
        .object({
          id: z.string().optional(),
          name,
          handleOrUrl: url,
          type: z.enum(["RSS", "YOUTUBE", "SUBSTACK"]),
          category: name,
          isActive: z.boolean(),
          pollingEnabled: z.boolean(),
        })
        .parse(b);
      const { id, ...data } = v;
      result = id
        ? await prisma.channel.update({ where: { id }, data })
        : await prisma.channel.create({ data });
    } else if (["categories", "tags", "audiences"].includes(section)) {
      const v = z
        .object({
          id: z.string().optional(),
          name,
          slug,
          description: z.string().max(1000).default(""),
          active: z.boolean(),
        })
        .parse(b);
      const { id, ...data } = v;
      const kind = (
        { categories: "CATEGORY", tags: "TAG", audiences: "AUDIENCE" } as any
      )[section];
      if (id) {
        const old = await prisma.taxonomy.findUniqueOrThrow({ where: { id } });
        const used = await prisma.article.count({
          where:
            kind === "CATEGORY"
              ? { category: old.name }
              : kind === "TAG"
                ? { tags: { has: old.slug } }
                : { audiences: { has: old.slug } },
        });
        if (
          used &&
          (old.slug !== data.slug ||
            (kind === "CATEGORY" && old.name !== data.name))
        )
          throw Error(
            "This taxonomy is used by articles. Create a new entry and move articles through review before changing its permanent name or URL.",
          );
      }
      result = id
        ? await prisma.taxonomy.update({
            where: { id },
            data: { ...data, kind },
          })
        : await prisma.taxonomy.create({ data: { ...data, kind } });
    } else if (section === "settings") {
      const v = z
        .object({
          name,
          tagline: z.string().min(5).max(200),
          contactEmail: z.union([z.email(), z.literal("")]),
          socialLinks: z.array(z.object({ label: name, url })).max(10),
          adsEnabled: z.boolean(),
          adsProvider: z.enum(["disabled", "placeholder", "adsense"]),
          adsenseId: z.string().regex(/^(ca-pub-\d{16})?$/),
          adUnits: z.record(z.string(), z.string().regex(/^\d{6,20}$/)),
          analyticsEnabled: z.boolean(),
          ga4Id: z.string().regex(/^(G-[A-Z0-9]+)?$/),
          searchConsoleId: z.string().max(200),
          rssFallbackEnabled: z.boolean(),
        })
        .strict()
        .parse(b);
      result = await prisma.siteSetting.upsert({
        where: { key: "publication" },
        create: { key: "publication", value: v },
        update: { value: v },
      });
    } else if (section === "partners") {
      const v = z
        .object({
          id: z.string().optional(),
          name,
          website: url,
          disclosure: z.string().min(20).max(1500),
          active: z.boolean(),
        })
        .parse(b);
      const { id, ...data } = v;
      result = id
        ? await prisma.partner.update({ where: { id }, data })
        : await prisma.partner.create({ data: { ...data, createdBy: p.id } });
    } else if (section === "partner-links") {
      const v = z
        .object({
          id: z.string().optional(),
          partnerId: z.string(),
          label: name,
          url,
          active: z.boolean(),
        })
        .parse(b);
      const partner = await prisma.partner.findUnique({
        where: { id: v.partnerId },
      });
      if (!partner?.active || !partner.disclosure)
        throw Error("Choose an active partner with a disclosure.");
      const { id, ...data } = v;
      result = id
        ? await prisma.partnerLink.update({ where: { id }, data })
        : await prisma.partnerLink.create({ data });
    } else if (section === "profiles") {
      const v = z
        .object({
          id: z.string().uuid(),
          email: z.email(),
          displayName: name,
          role: z.enum(["ADMIN", "EDITOR"]),
          active: z.boolean(),
        })
        .parse(b);
      if (v.id === p.id && (v.role !== "ADMIN" || !v.active))
        throw Error("You cannot remove your own administrator access.");
      const exists = await prisma.$queryRaw<
        { id: string }[]
      >`SELECT id FROM auth.users WHERE id=${v.id}::uuid AND email=${v.email}`;
      if (!exists.length)
        throw Error(
          "Invite this exact email through Supabase Auth first, then use its user ID.",
        );
      result = await prisma.profile.upsert({
        where: { id: v.id },
        create: v,
        update: v,
      });
    } else if (section === "newsletters") {
      if (b.action === "queue") {
        if (!emailConfigured())
          throw Error(
            "Configure the email provider before queueing a newsletter.",
          );
        result = await prisma.$transaction(async (tx) => {
          await tx.$queryRaw`SELECT id FROM "Newsletter" WHERE id=${b.id} FOR UPDATE`;
          const n = await tx.newsletter.findUniqueOrThrow({
            where: { id: b.id },
          });
          if (n.status !== "DRAFT")
            throw Error("This campaign has already been queued.");
          await tx.$executeRaw`INSERT INTO "NewsletterDelivery" (id,"newsletterId","subscriberId",status) SELECT gen_random_uuid()::text,${n.id},id,'PENDING' FROM "Subscriber" WHERE "confirmedAt" IS NOT NULL AND "unsubscribedAt" IS NULL ON CONFLICT ("newsletterId","subscriberId") DO NOTHING`;
          return tx.newsletter.update({
            where: { id: n.id },
            data: { status: "QUEUED" },
          });
        });
      } else {
        const v = z
          .object({ subject: name, body: z.string().min(40).max(80000) })
          .parse(b);
        if (b.id) {
          const changed = await prisma.newsletter.updateMany({
            where: { id: b.id, status: "DRAFT" },
            data: v,
          });
          if (!changed.count)
            throw Error("Only draft campaigns can be edited.");
          result = { id: b.id };
        } else
          result = await prisma.newsletter.create({
            data: { ...v, createdBy: p.id },
          });
      }
    } else throw Error("Unknown newsroom operation.");
    await prisma.auditLog.create({
      data: {
        actorId: p.id,
        action: `${section.toUpperCase()}_UPDATED`,
        detail: { id: result.id || section },
      },
    });
    revalidatePath("/", "layout");
    return Response.json({ ok: true, result });
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof Error ? e.message : "The change could not be saved.",
      },
      { status: 400 },
    );
  }
}

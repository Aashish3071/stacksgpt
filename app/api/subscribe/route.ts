import prisma from "@/lib/db";
import { limitedJson, rateLimit, sameOrigin } from "@/lib/security";
import { emailConfigured, sendMail } from "@/lib/newsletter";
import { siteUrl } from "@/lib/site";
import { z } from "zod";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    await rateLimit(req, "subscribe", 5);
    const { email } = z
      .object({
        email: z
          .email()
          .max(254)
          .transform((v) => v.toLowerCase().trim()),
      })
      .parse(await limitedJson(req, 2000));
    if (!emailConfigured())
      return Response.json(
        {
          error: "Newsletter signup will open when our email service is ready.",
        },
        { status: 503 },
      );
    const old = await prisma.subscriber.findUnique({ where: { email } });
    if (!old?.confirmedAt || old.unsubscribedAt) {
      const subscriber = await prisma.subscriber.upsert({
        where: { email },
        create: { email, source: "website" },
        update: old?.unsubscribedAt
          ? {
              token: crypto.randomUUID(),
              confirmedAt: null,
              unsubscribedAt: null,
            }
          : {},
      });
      const link = siteUrl(`/newsletter/confirm?token=${subscriber.token}`);
      await sendMail(
        email,
        "Confirm your Stacksgpt subscription",
        `<p>You requested the Stacksgpt newsletter.</p><p><a href="${link}">Confirm your subscription</a></p><p>If you did not request this, ignore this message. You will not receive newsletters without confirming.</p>`,
      );
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      {
        error:
          "We could not process that request. Check your email address and try again shortly.",
      },
      { status: 400 },
    );
  }
}

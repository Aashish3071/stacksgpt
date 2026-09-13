import prisma from "@/lib/db";
import { limitedJson, rateLimit, sameOrigin } from "@/lib/security";
import { emailConfigured, sendMail } from "@/lib/newsletter";
import { mailchimpConfigured, syncToMailchimp } from "@/lib/mailchimp";
import { siteUrl } from "@/lib/site";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    sameOrigin(req);
    await rateLimit(req, "subscribe", 10);

    const body = await limitedJson(req, 2000);
    const { email } = z
      .object({
        email: z
          .string()
          .email()
          .max(254)
          .transform((v) => v.toLowerCase().trim()),
      })
      .parse(body);

    const rawSource = (body as { source?: unknown } | null)?.source;
    const source =
      typeof rawSource === "string" && /^[a-z0-9:_-]{1,80}$/i.test(rawSource) ? rawSource : "website";

    const hasSmtp = emailConfigured();
    const hasMailchimp = mailchimpConfigured();

    // Upsert subscriber in database
    const old = await prisma.subscriber.findUnique({ where: { email } });
    const isNewOrResub = !old || !old.confirmedAt || old.unsubscribedAt;

    let subscriber = old;
    if (isNewOrResub) {
      subscriber = await prisma.subscriber.upsert({
        where: { email },
        create: {
          email,
          source,
          confirmedAt: hasSmtp ? null : new Date(),
        },
        update: {
          unsubscribedAt: null,
          ...(hasSmtp ? { confirmedAt: null } : { confirmedAt: new Date() }),
        },
      });
    }

    // Awaited because serverless functions can stop before background promises finish.
    if (hasMailchimp) {
      const result = await syncToMailchimp(email, { tags: [source] });
      if (!result.ok) console.warn("Mailchimp sync failed:", result.error);
    }

    // Send confirmation email via Zoho SMTP if configured
    if (hasSmtp && subscriber && !subscriber.confirmedAt) {
      const link = siteUrl(`/newsletter/confirm?token=${subscriber.token}`);
      sendMail(
        email,
        "Confirm your StacksGPT briefing subscription",
        `<p>You requested high-signal AI and tech briefings from StacksGPT.</p><p><a href="${link}">Confirm your subscription</a></p><p>If you did not request this, you can safely ignore this message.</p>`,
      ).catch((err) => {
        console.warn("SMTP sendMail error:", err);
      });
    }

    return Response.json({
      ok: true,
      message: hasSmtp
        ? "Check your inbox to confirm your subscription."
        : "You are subscribed to StacksGPT briefings.",
    });
  } catch (e) {
    return Response.json(
      {
        error:
          "We could not process that request. Please check your email address and try again.",
      },
      { status: 400 },
    );
  }
}

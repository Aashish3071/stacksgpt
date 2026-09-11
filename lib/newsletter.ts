import nodemailer from "nodemailer";
import prisma from "./db";
import { siteUrl } from "./site";
import { safeMarkdown } from "./safe-markdown";
export function emailConfigured() {
  return !!(
    process.env.SMTP_PASSWORD &&
    (process.env.SMTP_USER || "support@stacksgpt.com")
  );
}
export async function sendMail(
  to: string,
  subject: string,
  html: string,
  unsubscribe?: string,
) {
  if (!emailConfigured()) throw Error("Email sending is not configured.");
  const host = process.env.SMTP_HOST || "smtppro.zoho.com";
  const user = process.env.SMTP_USER || "support@stacksgpt.com";
  const from = process.env.NEWSLETTER_FROM || `StacksGPT <${user}>`;
  const transport = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== "false",
    auth: { user, pass: process.env.SMTP_PASSWORD! },
    connectionTimeout: 10000,
    socketTimeout: 15000,
  });
  return transport.sendMail({
    from,
    to,
    subject,
    html,
    ...(unsubscribe
      ? {
          headers: {
            "List-Unsubscribe": `<${unsubscribe}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        }
      : {}),
  });
}
export async function deliverNewsletterBatch() {
  if (!emailConfigured()) return { disabled: true };
  const rows = await prisma.newsletterDelivery.findMany({
    where: { status: "PENDING", newsletter: { status: "QUEUED" } },
    take: 5,
    include: { newsletter: true },
  });
  let sent = 0;
  const started = Date.now();
  for (const row of rows) {
    if (Date.now() - started > 20000) break;
    const claimed = await prisma.newsletterDelivery.updateMany({
      where: { id: row.id, status: "PENDING" },
      data: { status: "PROCESSING" },
    });
    if (!claimed.count) continue;
    const subscriber = await prisma.subscriber.findUnique({
      where: { id: row.subscriberId },
    });
    if (!subscriber?.confirmedAt || subscriber.unsubscribedAt) {
      await prisma.newsletterDelivery.update({
        where: { id: row.id },
        data: { status: "SKIPPED" },
      });
      continue;
    }
    try {
      const url = siteUrl(
        `/api/newsletter/unsubscribe?token=${subscriber.token}`,
      );
      await sendMail(
        subscriber.email,
        row.newsletter.subject,
        (await safeMarkdown(row.newsletter.body)) +
          `<hr><p><a href="${siteUrl(`/newsletter/unsubscribe?token=${subscriber.token}`)}">Unsubscribe</a></p>`,
        url,
      );
      await prisma.newsletterDelivery.update({
        where: { id: row.id },
        data: { status: "SENT", sentAt: new Date() },
      });
      sent++;
    } catch {
      await prisma.newsletterDelivery.update({
        where: { id: row.id },
        data: {
          status: "FAILED",
          error:
            "Delivery was not confirmed. Check provider logs before retrying.",
        },
      });
    }
  }
  const queued = await prisma.newsletter.findMany({
    where: { status: "QUEUED" },
    select: { id: true },
  });
  for (const n of queued) {
    const pending = await prisma.newsletterDelivery.count({
      where: { newsletterId: n.id, status: { in: ["PENDING", "PROCESSING"] } },
    });
    if (!pending) {
      const failed = await prisma.newsletterDelivery.count({
        where: { newsletterId: n.id, status: "FAILED" },
      });
      await prisma.newsletter.update({
        where: { id: n.id },
        data: { status: failed ? "COMPLETED_WITH_FAILURES" : "SENT" },
      });
    }
  }
  return { sent };
}

import prisma from "@/lib/db";
import { rateLimit } from "@/lib/security";
export async function POST(req: Request) {
  try {
    await rateLimit(req, "newsletter-confirm", 10);
    const token = new URL(req.url).searchParams.get("token");
    if (!token || !/^[0-9a-f-]{36}$/.test(token)) throw Error();
    const r = await prisma.subscriber.updateMany({
      where: { token, confirmedAt: null, unsubscribedAt: null },
      data: { confirmedAt: new Date() },
    });
    return new Response(
      r.count
        ? "Your subscription is confirmed. You can close this page."
        : "This link is invalid or already confirmed.",
      {
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
          "Cache-Control": "no-store",
          "X-Robots-Tag": "noindex",
        },
      },
    );
  } catch {
    return new Response("Invalid confirmation request.", { status: 400 });
  }
}

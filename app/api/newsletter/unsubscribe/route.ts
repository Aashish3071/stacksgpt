import prisma from "@/lib/db";
export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token || !/^[0-9a-f-]{36}$/.test(token))
    return new Response("Invalid link.", { status: 400 });
  await prisma.subscriber.updateMany({
    where: { token, unsubscribedAt: null },
    data: { unsubscribedAt: new Date() },
  });
  return new Response(
    "You are unsubscribed. No more newsletters will be sent.",
    {
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex",
      },
    },
  );
}

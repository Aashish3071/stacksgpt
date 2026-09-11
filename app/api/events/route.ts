import prisma from "@/lib/db";
import { limitedJson, rateLimit, sameOrigin } from "@/lib/security";
import { getSettings } from "@/lib/settings";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    if (
      !/(?:^|;\s*)stacksgpt_consent=yes(?:;|$)/.test(
        req.headers.get("cookie") || "",
      ) ||
      !(await getSettings()).analyticsEnabled
    )
      return new Response(null, { status: 204 });
    await rateLimit(req, "events", 40);
    const { event, slug } = await limitedJson(req, 1000);
    if (
      ![
        "article_view",
        "engaged_30s",
        "scroll_75",
        "outbound_click",
        "search",
        "newsletter_signup",
        "partner_click",
      ].includes(event)
    )
      throw Error();
    let articleId = "";
    if (slug) {
      if (typeof slug !== "string" || slug.length > 100) throw Error();
      const a = await prisma.article.findFirst({
        where: { slug, isPublished: true },
        select: { id: true },
      });
      if (!a) return new Response(null, { status: 204 });
      articleId = a.id;
    }
    const day = new Date().toISOString().slice(0, 10);
    await prisma.eventDaily.upsert({
      where: { day_event_articleId: { day, event, articleId } },
      create: { day, event, articleId, count: 1 },
      update: { count: { increment: 1 } },
    });
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: "Invalid event." }, { status: 400 });
  }
}

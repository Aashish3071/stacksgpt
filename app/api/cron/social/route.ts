import { deliverApprovedSocialPosts } from "@/lib/social";
import { requireSecret } from "@/lib/security";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function GET(req: Request) {
  try {
    requireSecret(req, "CRON_SECRET");
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const results = await deliverApprovedSocialPosts();
    return Response.json({ results });
  } catch {
    return Response.json({ error: "Social delivery failed." }, { status: 500 });
  }
}

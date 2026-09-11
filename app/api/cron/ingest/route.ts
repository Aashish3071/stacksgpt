import { runIngestion } from "@/lib/ingest";
import { requireSecret } from "@/lib/security";
import { getSettings } from "@/lib/settings";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function GET(req: Request) {
  try {
    requireSecret(req, "CRON_SECRET");
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await getSettings()).rssFallbackEnabled)
    return Response.json({ disabled: true });
  try {
    return Response.json(await runIngestion());
  } catch {
    return Response.json(
      { error: "Feed ingestion failed. Check source health in the newsroom." },
      { status: 500 },
    );
  }
}

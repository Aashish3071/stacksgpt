import { requireSecret, rateLimit, limitedJson } from "@/lib/security";
import { processImport } from "@/lib/importing";
export async function POST(req: Request) {
  try {
    requireSecret(req, "INGEST_SECRET");
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await rateLimit(req, "import", 20);
    const body = await limitedJson(req);
    if (
      typeof body.externalId !== "string" ||
      !/^[a-z0-9-]{5,150}$/.test(body.externalId) ||
      typeof body.mdx !== "string"
    )
      throw Error("Supply externalId (the permanent file ID) and mdx.");
    const result = await processImport(body.mdx, body.externalId + ".mdx", {
      local: false,
    });
    return Response.json(result, { status: result.unchanged ? 200 : 201 });
  } catch (e) {
    return Response.json(
      {
        errors: (e instanceof Error ? e.message : "Import failed").split("\n"),
      },
      { status: 422 },
    );
  }
}

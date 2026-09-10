import { NextResponse } from "next/server";
import { runIngestion, runDrafting, DEFAULT_DRAFT_LIMIT } from "@/lib/ingest";

export const dynamic = "force-dynamic";
// Ingestion plus several LLM calls exceeds the default budget. Vercel Hobby caps
// this at 60s — if a run times out, lower the draft limit with ?limit=4.
export const maxDuration = 60;

/**
 * Daily ingestion run. Triggered by Vercel Cron (see vercel.json).
 *
 * Guarded by CRON_SECRET so it cannot be invoked by anyone who finds the URL —
 * an open endpoint here would let a stranger burn your entire LLM budget.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured; refusing to run." },
      { status: 500 }
    );
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();

  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit")) || DEFAULT_DRAFT_LIMIT;

    const ingestion = await runIngestion();
    const drafting = await runDrafting(limit);

    const report = {
      ok: true,
      durationMs: Date.now() - startedAt,
      ingestion,
      drafting,
    };

    // Logged so a failing feed is visible in the platform logs, not just here.
    console.log("[cron/ingest]", JSON.stringify(report));

    return NextResponse.json(report);
  } catch (error: any) {
    console.error("[cron/ingest] run failed:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Ingestion run failed" },
      { status: 500 }
    );
  }
}

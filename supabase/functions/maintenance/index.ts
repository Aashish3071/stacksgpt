// Supabase scheduler calls this relay with MAINTENANCE_SECRET. The Vercel cron
// secret stays on the server; no article can bypass its approved-version check.
Deno.serve(async (req: Request) => {
  const key = Deno.env.get("MAINTENANCE_SECRET");
  const supplied = req.headers.get("Authorization");
  if (
    req.method !== "POST" ||
    !key ||
    key.length < 32 ||
    supplied !== `Bearer ${key}`
  )
    return new Response("Unauthorized", { status: 401 });
  const origin = Deno.env.get("PUBLICATION_URL");
  const secret = Deno.env.get("PUBLICATION_CRON_SECRET");
  if (!origin?.startsWith("https://") || !secret || secret.length < 32)
    return new Response("Scheduler is not configured.", { status: 503 });
  const r = await fetch(`${origin.replace(/\/$/, "")}/api/cron/publish`, {
    headers: { Authorization: `Bearer ${secret}` },
    redirect: "error",
    signal: AbortSignal.timeout(55000),
  });
  return new Response(await r.text(), {
    status: r.status,
    headers: { "Content-Type": "application/json" },
  });
});

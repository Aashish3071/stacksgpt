import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
const base = process.env.TEST_SITE_URL || "http://localhost:3100";
async function main() {
  for (const page of [
    "/",
    "/latest",
    "/archive",
    "/search?q=mistral",
    "/category/research",
    "/methodology",
    "/corrections",
    "/terms",
    "/partners",
    "/sitemap.xml",
    "/sitemaps/0.xml",
    "/sitemaps/1.xml",
    "/llms.txt",
    "/admin/login",
  ]) {
    const r = await fetch(base + page);
    assert.equal(r.status, 200, page);
    console.log("PASS", page);
  }
  for (const route of ["/admin", "/admin/preview/unknown"]) {
    const r = await fetch(base + route, { redirect: "manual" });
    assert.equal(r.status, 307);
    assert.ok(r.headers.get("location")?.includes("/admin/login"));
  }
  for (const route of [
    "/api/articles",
    "/api/import/leads",
    "/api/cron/publish",
  ]) {
    assert.equal((await fetch(base + route)).status, 401);
  }
  const spoof = await fetch(base + "/api/articles", {
    headers: {
      cookie: "stacksgpt_session=not-a-jwt",
      "x-middleware-subrequest":
        "middleware:middleware:middleware:middleware:middleware",
    },
  });
  assert.equal(spoof.status, 401);
  assert.equal(
    (
      await fetch(base + "/api/import/article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      })
    ).status,
    401,
  );
  const confirmation = await fetch(
    base + "/newsletter/confirm?token=11111111-1111-1111-1111-111111111111",
  );
  assert.equal(confirmation.status, 200);
  assert.equal(confirmation.headers.get("referrer-policy"), "no-referrer");
  const privateKeys = [
    "SUPABASE_PUBLISHABLE_KEY",
    "SMTP_PASSWORD",
    "INGEST_SECRET",
    "CRON_SECRET",
    "RATE_LIMIT_SECRET",
  ];
  const values = privateKeys
    .map((k) => process.env[k])
    .filter((s): s is string => !!s && s.length > 12);
  if (process.env.DATABASE_URL)
    values.push(decodeURIComponent(new URL(process.env.DATABASE_URL).password));
  async function scan(dir: string) {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const f = path.join(dir, e.name);
      if (e.isDirectory()) await scan(f);
      else {
        const body = await readFile(f, "utf8");
        for (const v of values)
          assert.ok(
            !body.includes(v),
            `A server credential appeared in browser asset ${f}`,
          );
      }
    }
  }
  await scan(".next/static");
  console.log(
    "PASS: private routes reject missing or forged credentials; newsletter tokens have no-referrer protection; browser assets contain no configured server credentials.",
  );
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : "Smoke tests failed");
  process.exitCode = 1;
});

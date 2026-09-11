import { readFile } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import pg from "pg";
import { postgresConfig } from "../lib/postgres-config";
async function main() {
  const value = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!value) throw Error("DIRECT_URL is required.");
  const { config, schema } = postgresConfig(value);
  if (schema !== "public")
    throw Error(
      "This deployment migration targets the public schema. Use the integration tests for temporary schemas.",
    );
  const c = new pg.Client(config);
  await c.connect();
  try {
    await c.query("BEGIN");
    await c.query(
      "SELECT pg_advisory_xact_lock(hashtext('stacksgpt-migrations'))",
    );
    const baselineName = "202609100000_baseline";
    const deltaName = "202609100001_newsroom";
    const baseline = await readFile(
      `prisma/migrations/${baselineName}/migration.sql`,
      "utf8",
    );
    const delta = await readFile(
      `prisma/migrations/${deltaName}/migration.sql`,
      "utf8",
    );
    const history = await c.query(
      "SELECT to_regclass('public._prisma_migrations') AS name",
    );
    if (!history.rows[0].name) {
      const existing = await c.query(
        "SELECT to_regclass('public.\"Article\"') AS name",
      );
      if (existing.rows[0].name) {
        for (const match of baseline.matchAll(
          /CREATE TABLE "([^"]+)" \(([\s\S]*?)\n\);/g,
        )) {
          const expected = [...match[2].matchAll(/^\s+"([^"]+)"\s/gm)]
            .map((m) => m[1])
            .sort();
          const actual = (
            await c.query(
              "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1",
              [match[1]],
            )
          ).rows
            .map((r) => r.column_name)
            .sort();
          if (JSON.stringify(actual) !== JSON.stringify(expected))
            throw Error(
              `Baseline mismatch in ${match[1]}. Inspect this database before migration.`,
            );
        }
      } else await c.query(baseline);
      await c.query(
        `CREATE TABLE public._prisma_migrations (id varchar(36) PRIMARY KEY,checksum varchar(64) NOT NULL,finished_at timestamptz,migration_name varchar(255) NOT NULL,logs text,rolled_back_at timestamptz,started_at timestamptz NOT NULL DEFAULT now(),applied_steps_count integer NOT NULL DEFAULT 0)`,
      );
      await c.query(
        "INSERT INTO public._prisma_migrations (id,checksum,migration_name,finished_at,applied_steps_count) VALUES ($1,$2,$3,now(),1)",
        [
          randomUUID(),
          createHash("sha256").update(baseline).digest("hex"),
          baselineName,
        ],
      );
    }
    const applied = await c.query(
      "SELECT checksum FROM public._prisma_migrations WHERE migration_name=$1 AND finished_at IS NOT NULL AND rolled_back_at IS NULL",
      [deltaName],
    );
    const hash = createHash("sha256").update(delta).digest("hex");
    if (applied.rows.length) {
      if (applied.rows[0].checksum !== hash)
        throw Error(
          "Applied migration checksum changed. Add a new migration instead.",
        );
    } else {
      await c.query(delta);
      await c.query(
        "INSERT INTO public._prisma_migrations (id,checksum,migration_name,finished_at,applied_steps_count) VALUES ($1,$2,$3,now(),1)",
        [randomUUID(), hash, deltaName],
      );
    }
    await c.query(await readFile("supabase/security.sql", "utf8"));
    for (const name of [
      "Productivity",
      "Writing",
      "Coding",
      "Research",
      "Design",
      "Automation",
    ])
      await c.query(
        "INSERT INTO \"Taxonomy\" (id,kind,slug,name) VALUES ($1,'CATEGORY',$2,$3) ON CONFLICT (kind,slug) DO NOTHING",
        [randomUUID(), name.toLowerCase(), name],
      );
    const sources = await c.query(
      'SELECT DISTINCT "sourceAuthor" AS name FROM "Article" WHERE "sourceAuthor" IS NOT NULL',
    );
    for (const { name } of sources.rows) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      if (slug)
        await c.query(
          "INSERT INTO \"Taxonomy\" (id,kind,slug,name) VALUES ($1,'SOURCE',$2,$3) ON CONFLICT(kind,slug) DO NOTHING",
          [randomUUID(), slug, name],
        );
    }
    await c.query(
      "ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY",
    );
    await c.query(
      "REVOKE ALL ON public._prisma_migrations FROM anon,authenticated",
    );
    await c.query("COMMIT");
    console.log(
      "Newsroom migration, access policies, storage bucket and taxonomy are ready. Existing articles retain their publication state.",
    );
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    await c.end();
  }
}
main().catch((e) => {
  console.error(
    e instanceof Error ? e.message : "Migration failed; changes rolled back.",
  );
  process.exitCode = 1;
});

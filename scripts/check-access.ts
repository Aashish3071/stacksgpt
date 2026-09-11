import assert from "node:assert/strict";
import pg from "pg";
import { postgresConfig } from "../lib/postgres-config";
async function main() {
  const c = new pg.Client(
    postgresConfig(process.env.DIRECT_URL || process.env.DATABASE_URL!).config,
  );
  await c.connect();
  try {
    const rls = await c.query(
      `SELECT tablename,rowsecurity FROM pg_tables WHERE schemaname='public'`,
    );
    assert.ok(rls.rows.every((r) => r.rowsecurity));
    for (const role of ["anon", "authenticated"]) {
      await c.query("BEGIN");
      await c.query(`SET LOCAL ROLE ${role}`);
      const p = await c.query(
        `SELECT has_table_privilege(current_user,'public."Article"','SELECT') AS article,has_table_privilege(current_user,'public."Subscriber"','SELECT') AS subscriber,has_table_privilege(current_user,'public."Article"','UPDATE') AS edit`,
      );
      assert.deepEqual(p.rows[0], {
        article: false,
        subscriber: false,
        edit: false,
      });
      if (role === "authenticated") {
        assert.equal(
          (await c.query('SELECT count(*)::int AS n FROM public."Profile"'))
            .rows[0].n,
          0,
        );
        assert.equal(
          (await c.query("SELECT public.stacksgpt_is_editor() AS editor"))
            .rows[0].editor,
          false,
        );
      }
      await c.query("ROLLBACK");
    }
    const after = await c.query(
      `SELECT (SELECT count(*)::int FROM "Article" WHERE "isPublished") AS published,(SELECT count(*)::int FROM "Article" WHERE "pendingDraft" IS NOT NULL) AS pending,(SELECT count(*)::int FROM "Profile") AS profiles`,
    );
    console.log(
      "PASS: RLS is enabled and anonymous/unregistered users cannot read or edit private records.",
    );
    console.log("Publication counts:", JSON.stringify(after.rows[0]));
  } finally {
    await c.end();
  }
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : "Access check failed");
  process.exitCode = 1;
});

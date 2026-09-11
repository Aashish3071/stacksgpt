import pg from "pg";
import { postgresConfig } from "../lib/postgres-config";
async function main() {
  const base = process.env.DIRECT_URL || process.env.DATABASE_URL!;
  const { config } = postgresConfig(base);
  const c = new pg.Client(config);
  await c.connect();
  try {
    const tables = await c.query(
      `SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`,
    );
    const counts = await c.query(
      `SELECT (SELECT count(*)::int FROM public."Article") AS articles,(SELECT count(*)::int FROM public."Article" WHERE "isPublished") AS published,(SELECT count(*)::int FROM public."Subscriber") AS subscribers,(SELECT count(*)::int FROM auth.users) AS auth_users`,
    );
    const columns = await c.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='Article' ORDER BY ordinal_position`,
    );
    console.log(
      JSON.stringify({
        tables: tables.rows.map((x) => x.tablename),
        counts: counts.rows[0],
        articleColumns: columns.rows.map((x) => x.column_name),
      }),
    );
  } finally {
    await c.end();
  }
}
main().catch(() => {
  console.error("Database status check failed.");
  process.exitCode = 1;
});

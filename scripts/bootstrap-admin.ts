import pg from "pg";
import { postgresConfig } from "../lib/postgres-config";
async function main() {
  const [email, displayName] = process.argv.slice(2);
  if (!email || !displayName)
    throw Error(
      "Provide the existing Supabase Auth email and its display name.",
    );
  const { config } = postgresConfig(
    process.env.DIRECT_URL || process.env.DATABASE_URL!,
  );
  const c = new pg.Client(config);
  await c.connect();
  try {
    await c.query("BEGIN");
    await c.query(
      "SELECT pg_advisory_xact_lock(hashtext('stacksgpt-bootstrap'))",
    );
    const admins = await c.query(
      "SELECT count(*)::int AS n FROM \"Profile\" WHERE role='ADMIN' AND active",
    );
    if (admins.rows[0].n)
      throw Error(
        "An administrator already exists. Manage additional accounts through the newsroom.",
      );
    const user = await c.query(
      "SELECT id,email FROM auth.users WHERE lower(email)=lower($1)",
      [email],
    );
    if (user.rows.length !== 1)
      throw Error("Create or invite this user in Supabase Auth first.");
    await c.query(
      "INSERT INTO \"Profile\"(id,email,\"displayName\",role) VALUES($1,$2,$3,'ADMIN') ON CONFLICT(id) DO UPDATE SET role='ADMIN',active=true",
      [user.rows[0].id, user.rows[0].email, displayName],
    );
    await c.query(
      'INSERT INTO "AuditLog"(id,"actorId",action) VALUES($1,$2,\'ADMIN_BOOTSTRAPPED\')',
      [crypto.randomUUID(), user.rows[0].id],
    );
    await c.query("COMMIT");
    console.log("The existing Supabase user now has administrator access.");
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    await c.end();
  }
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : "Bootstrap failed");
  process.exitCode = 1;
});

import pg from "pg";
import { postgresConfig } from "../lib/postgres-config";
import crypto from "crypto";

async function main() {
  const email = process.argv[2] || "admin@stacksgpt.com";
  const password = process.argv[3] || process.env.ADMIN_PASSWORD;
  if (!password) {
    console.error(
      "No password provided. Pass one as an argument or set ADMIN_PASSWORD.",
    );
    process.exit(1);
  }
  const displayName = process.argv[4] || "Newsroom Admin";

  const { config } = postgresConfig(process.env.DIRECT_URL || process.env.DATABASE_URL!);
  const client = new pg.Client(config);
  await client.connect();

  try {
    await client.query("BEGIN");

    const existing = await client.query(
      "SELECT id FROM auth.users WHERE lower(email) = lower($1)",
      [email],
    );
    let userId = existing.rows[0]?.id;

    if (!userId) {
      userId = crypto.randomUUID();
      await client.query(
        `
        INSERT INTO auth.users (
          instance_id,
          id,
          aud,
          role,
          email,
          encrypted_password,
          email_confirmed_at,
          raw_app_meta_data,
          raw_user_meta_data,
          created_at,
          updated_at
        ) VALUES (
          '00000000-0000-0000-0000-000000000000',
          $1,
          'authenticated',
          'authenticated',
          $2,
          extensions.crypt($3, extensions.gen_salt('bf')),
          now(),
          '{"provider":"email","providers":["email"]}',
          '{"name":"Newsroom Admin"}',
          now(),
          now()
        )
      `,
        [userId, email, password],
      );
      console.log("Created user in auth.users with ID:", userId);
    } else {
      await client.query(
        `
        UPDATE auth.users 
        SET encrypted_password = extensions.crypt($1, extensions.gen_salt('bf')),
            email_confirmed_at = COALESCE(email_confirmed_at, now()),
            updated_at = now()
        WHERE id = $2
      `,
        [password, userId],
      );
      console.log("Updated password for existing user in auth.users");
    }

    await client.query(
      `
      INSERT INTO public."Profile" (id, email, "displayName", role, active, "createdAt")
      VALUES ($1, $2, $3, 'ADMIN', true, now())
      ON CONFLICT (id) DO UPDATE SET role = 'ADMIN', active = true, "displayName" = $3
    `,
      [userId, email, displayName],
    );

    await client.query("COMMIT");
    console.log("Admin profile verified in public.Profile!");
    console.log(`Credentials -> Email: ${email} | Password: ${password}`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Failed to create admin:", err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();

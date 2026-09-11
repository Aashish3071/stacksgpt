import { readFileSync } from "node:fs";
import path from "node:path";
export function postgresConfig(value: string) {
  const url = new URL(value);
  const schema = url.searchParams.get("schema") || "public";
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schema))
    throw Error("Invalid database schema.");
  const isSupabase =
    url.hostname.endsWith(".supabase.co") ||
    url.hostname.endsWith(".pooler.supabase.com");
  const mode = url.searchParams.get("sslmode");
  for (const key of [
    "sslmode",
    "sslcert",
    "sslrootcert",
    "sslaccept",
    "schema",
    "pgbouncer",
    "connection_limit",
    "pool_timeout",
  ])
    url.searchParams.delete(key);
  return {
    schema,
    config: {
      connectionString: url.toString(),
      max: 3,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      options: `-c search_path=${schema}`,
      ssl: isSupabase
        ? {
            rejectUnauthorized: true,
            ca: readFileSync(
              path.join(process.cwd(), "certs/supabase-root-2021.crt"),
              "utf8",
            ),
          }
        : mode === "require" || mode === "verify-full"
          ? { rejectUnauthorized: true }
          : undefined,
    },
  };
}

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
  // Deliberately NOT pinning a downloaded CA file here: Supabase's direct
  // host and pooler host present different certs, and a pinned cert breaks
  // every connection the moment either side rotates. System CAs already
  // trust Supabase's public CA, so plain TLS verification is both safer
  // (no stale pinned file) and actually works.
  return {
    schema,
    config: {
      connectionString: url.toString(),
      max: 3,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      options: `-c search_path=${schema}`,
      ssl:
        isSupabase || mode === "require" || mode === "verify-full"
          ? { rejectUnauthorized: true }
          : undefined,
    },
  };
}

import { PrismaClient } from "@prisma/client";

/**
 * Resolves the database connection strings.
 *
 * This deliberately does NOT fall back to a placeholder URL. A placeholder makes
 * a misconfigured deployment look healthy: the build succeeds, every query fails
 * quietly, and the site ships with zero articles and an empty sitemap. For a
 * business that lives on search traffic, silently replacing a working site with
 * an empty one is worse than failing the deploy — a failed deploy leaves the
 * previous good version serving.
 *
 * Vercel's own Postgres integrations expose their own variable names, so those
 * are accepted as sources; anything else is a genuine misconfiguration.
 */
function resolveDatabaseUrl(): string | null {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL,
  ];

  for (const url of candidates) {
    if (url && (url.startsWith("postgres://") || url.startsWith("postgresql://"))) {
      return url;
    }
  }
  return null;
}

const resolved = resolveDatabaseUrl();

if (resolved) {
  process.env.DATABASE_URL = resolved;
  if (!process.env.DIRECT_URL) {
    process.env.DIRECT_URL = process.env.POSTGRES_URL_NON_POOLING || resolved;
  }
}

/**
 * Serverless functions open a connection per invocation. Supabase's direct
 * endpoint (port 5432) has a low connection ceiling and will exhaust under
 * traffic; its transaction pooler (port 6543) is what serverless should use.
 * Warn rather than throw, because local development against the direct endpoint
 * is perfectly fine.
 */
if (resolved && process.env.VERCEL) {
  const pooled = /pgbouncer=true/.test(resolved) || /:6543\//.test(resolved) || /pooler\./.test(resolved);
  if (!pooled) {
    console.warn(
      "[db] DATABASE_URL is not a pooled connection. On serverless this exhausts " +
        "the database's connection limit under load. Use the transaction pooler " +
        "(port 6543) for DATABASE_URL and keep the direct endpoint for DIRECT_URL."
    );
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;

/** True when a usable Postgres connection string was found. */
export const isDatabaseConfigured = resolved !== null;

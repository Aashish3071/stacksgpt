import { PrismaClient } from "@prisma/client";

function resolveAndNormalizeUrl(): string | undefined {
  const raw =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL;

  if (!raw) return undefined;

  try {
    const parsed = new URL(raw);
    const isPooler =
      parsed.port === "6543" ||
      parsed.hostname.includes("pooler") ||
      parsed.searchParams.get("pgbouncer") === "true";

    if (isPooler) {
      parsed.searchParams.set("pgbouncer", "true");
      if (!parsed.searchParams.has("connection_limit")) {
        // One connection is right at *runtime*: each serverless invocation
        // handles a single request, and many concurrent lambdas each holding
        // a pool would exhaust pgbouncer's client limit.
        //
        // It is wrong during `next build`, which is one long-lived process
        // rendering every static page concurrently. With a pool of one, pages
        // queue behind a single connection and time out after 10s (P2024) —
        // and because every call site catches its own database error and
        // falls back to empty data, the build still "succeeds" while quietly
        // emitting stub pages. Measured here: 3 of 7 articles built as ~10KB
        // shells with no headline, against ~50KB for the healthy ones.
        const building =
          process.env.NEXT_PHASE === "phase-production-build" ||
          process.env.npm_lifecycle_event === "build";
        parsed.searchParams.set("connection_limit", building ? "5" : "1");
        if (building) parsed.searchParams.set("pool_timeout", "30");
      }
    }

    const isRemote =
      parsed.hostname.endsWith(".supabase.co") ||
      parsed.hostname.includes("supabase.com") ||
      parsed.hostname.includes("aws") ||
      parsed.hostname !== "localhost";

    if (isRemote && !parsed.searchParams.has("sslmode")) {
      parsed.searchParams.set("sslmode", "require");
    }

    const normalized = parsed.toString();
    process.env.DATABASE_URL = normalized;
    if (!process.env.DIRECT_URL) {
      process.env.DIRECT_URL = process.env.POSTGRES_URL_NON_POOLING || normalized;
    }
    return normalized;
  } catch {
    return raw;
  }
}

const resolvedUrl = resolveAndNormalizeUrl();

const globalDb = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalDb.prisma ||
  new PrismaClient({
    ...(resolvedUrl
      ? {
          datasources: {
            db: { url: resolvedUrl },
          },
        }
      : {}),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : [],
  });

if (process.env.NODE_ENV !== "production") globalDb.prisma = prisma;

export const isDatabaseConfigured = !!resolvedUrl;
export default prisma;

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
        parsed.searchParams.set("connection_limit", "1");
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

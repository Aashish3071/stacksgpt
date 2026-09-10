import { PrismaClient } from "@prisma/client";

// Ensure DATABASE_URL is a valid PostgreSQL URL for Prisma Client
if (!process.env.DATABASE_URL || (!process.env.DATABASE_URL.startsWith("postgres://") && !process.env.DATABASE_URL.startsWith("postgresql://"))) {
  process.env.DATABASE_URL =
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    "postgresql://postgres:postgres@localhost:5432/placeholder?sslmode=require";
}

if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL =
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL;
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

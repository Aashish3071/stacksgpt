import { PrismaClient } from "@prisma/client";

const globalDb = globalThis as unknown as { prisma: PrismaClient | undefined };

const prisma =
  globalDb.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : [],
  });

if (process.env.NODE_ENV !== "production") globalDb.prisma = prisma;

export { prisma };
export default prisma;

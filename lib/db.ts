import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { postgresConfig } from "./postgres-config";
const url =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL;
export const isDatabaseConfigured = !!url;
if (!url) throw Error("DATABASE_URL is required.");
const { config, schema } = postgresConfig(url);
const globalDb = globalThis as unknown as { prisma: PrismaClient | undefined };
export const prisma =
  globalDb.prisma ||
  new PrismaClient({ adapter: new PrismaPg(config, { schema }), log: [] });
if (process.env.NODE_ENV !== "production") globalDb.prisma = prisma;
export default prisma;

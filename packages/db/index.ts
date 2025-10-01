// Use require import form for compatibility with TS transpilation and Prisma type generation timing
import * as PrismaNS from '@prisma/client';
const PrismaClient = (PrismaNS as any).PrismaClient as typeof PrismaNS.PrismaClient;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export const db = prisma;
export type { PrismaClient } from '@prisma/client';

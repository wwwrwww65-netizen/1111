// Use namespace + type import to avoid timing issues during CI builds
import * as PrismaNS from '@prisma/client';
import type { PrismaClient as PrismaClientType } from '@prisma/client';
const PrismaClientCtor = (PrismaNS as any).PrismaClient as unknown as new (...args: any[]) => PrismaClientType;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientType | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClientCtor({
    log:
      process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export const db = prisma;
export type { PrismaClientType as PrismaClient };

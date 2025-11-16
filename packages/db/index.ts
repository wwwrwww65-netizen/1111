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

// Optional slow query logging (enable by setting SLOW_QUERY_MS, e.g., 200)
try{
  const slowMs = Number(process.env.SLOW_QUERY_MS || '0');
  if (isFinite(slowMs) && slowMs > 0 && typeof (prisma as any).$on === 'function'){
    (prisma as any).$on('query', (e: any) => {
      try{
        const dur = Number(e?.duration || 0);
        if (dur >= slowMs){
          // Minimal structured log to stdout
          console.warn(JSON.stringify({ level:'warn', type:'slow_query', duration_ms: dur, query: e?.query, params: e?.params }));
        }
      }catch{}
    });
  }
}catch{}

export const db = prisma;
export type { PrismaClientType as PrismaClient };

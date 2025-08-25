import { initTRPC } from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';
import { prisma } from '@repo/db';

// Define the user type
export interface JWTPayload {
  userId: string;
  email: string;
  role: 'USER' | 'ADMIN';
  iat: number;
  exp: number;
}

// The context is passed to all procedures
export const createContext = ({
  req,
  res,
}: trpcExpress.CreateExpressContextOptions) => {
  // Here you could get user session data
  // For now, we'll just pass the prisma client and request
  return {
    prisma,
    req,
    res,
    user: null as JWTPayload | null,
  };
};

// You can use any variable name you like.
// We use t and procedural style to infer types as we add procedures.
const t = initTRPC.context<typeof createContext>().create();

export type Context = ReturnType<typeof createContext>;
export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

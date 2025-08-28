import { initTRPC } from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';
import { prisma } from '@repo/db';
import { authMiddleware } from './middleware/auth';

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
  return {
    prisma,
    req,
    res,
    user: null as JWTPayload | null,
  };
};

export type Context = ReturnType<typeof createContext>;

<<<<<<< HEAD
const trpc = initTRPC.context<Context>().create();

export const t: typeof trpc = trpc;
export const router: typeof trpc.router = trpc.router;
export const publicProcedure: typeof trpc.procedure = trpc.procedure;
export const middleware: typeof trpc.middleware = trpc.middleware;
export const protectedProcedure: typeof trpc.procedure = trpc.procedure.use(authMiddleware);
=======
export const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;
>>>>>>> origin/main

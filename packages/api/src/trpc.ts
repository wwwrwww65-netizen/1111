import * as trpcExpress from '@trpc/server/adapters/express';
import { createContext, Context } from './context';
export { t, router, publicProcedure, middleware } from './trpc-setup';

// Define the user type
export interface JWTPayload {
  userId: string;
  email: string;
  role: 'USER' | 'ADMIN';
  iat: number;
  exp: number;
}

// The context is passed to all procedures
export { createContext };
export type { Context };

// Note: protectedProcedure is defined in middleware/auth to avoid circular imports

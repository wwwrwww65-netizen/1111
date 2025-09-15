import { TRPCError } from '@trpc/server';
import { t } from '../trpc-setup';
import { z } from 'zod';
import { getJwtSecret, signJwt, verifyJwt, readTokenFromRequest as readFromReq } from '../utils/jwt';

const getJwtSecretLocal = getJwtSecret;

// Schema for JWT payload
const JWTPayloadSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  role: z.enum(['USER', 'ADMIN']),
  iat: z.number(),
  exp: z.number(),
});

export type JWTPayload = z.infer<typeof JWTPayloadSchema>;

// Create JWT token
export const createToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => signJwt(payload);

// Verify JWT token
export const verifyToken = (token: string): JWTPayload => verifyJwt(token);

export const readTokenFromRequest = (req: any): string | null => readFromReq(req);

// Auth middleware
export const authMiddleware = t.middleware(async ({ ctx, next }) => {
  const token = readTokenFromRequest(ctx.req);
  if (!token) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No token provided' });
  }
  const payload = verifyToken(token);
  return next({ ctx: { ...ctx, user: payload } });
});

// Optional auth middleware
export const optionalAuthMiddleware = t.middleware(async ({ ctx, next }) => {
  const token = readTokenFromRequest(ctx.req);
  if (token) {
    try {
      const payload = verifyToken(token);
      return next({ ctx: { ...ctx, user: payload } });
    } catch {}
  }
  return next({ ctx: { ...ctx, user: null } });
});

// Admin middleware
export const adminMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user || ctx.user.role !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

// Protected procedure composed here
export const protectedProcedure = t.procedure.use(authMiddleware);

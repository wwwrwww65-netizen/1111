import { TRPCError } from '@trpc/server';
import { t } from '../trpc-setup';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

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
export const createToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

// Verify JWT token
export const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return JWTPayloadSchema.parse(decoded);
  } catch {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid or expired token' });
  }
};

export const readTokenFromRequest = (req: any): string | null => {
  const cookieToken = req?.cookies?.auth_token as string | undefined;
  if (cookieToken) return cookieToken;
  const header = req?.headers?.authorization as string | undefined;
  if (header?.startsWith('Bearer ')) return header.replace('Bearer ', '');
  return null;
};

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

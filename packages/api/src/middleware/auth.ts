import { TRPCError } from '@trpc/server';
import { t } from '../trpc';
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
  } catch (error) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired token',
    });
  }
};

export const authMiddleware: ReturnType<typeof t.middleware> = t.middleware(async ({ ctx, next }) => {
  const token = ctx.req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'No token provided',
    });
  }

  const payload = verifyToken(token);

  return next({
    ctx: {
      ...ctx,
      user: payload,
    },
  });
});

export const optionalAuthMiddleware: ReturnType<typeof t.middleware> = t.middleware(async ({ ctx, next }) => {
  const token = ctx.req.headers.authorization?.replace('Bearer ', '');

  if (token) {
    try {
      const payload = verifyToken(token);
      return next({
        ctx: {
          ...ctx,
          user: payload,
        },
      });
    } catch (error) {
      // Continue without user if token is invalid
    }
  }

  return next({
    ctx: {
      ...ctx,
      user: null,
    },
  });
});

export const adminMiddleware: ReturnType<typeof t.middleware> = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user || ctx.user.role !== 'ADMIN') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    });
  }

  return next({
    ctx,
  });
});
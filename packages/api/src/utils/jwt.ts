import jwt from 'jsonwebtoken';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

const JWTPayloadSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  role: z.enum(['USER', 'ADMIN']),
  iat: z.number(),
  exp: z.number(),
});

export type JWTPayload = z.infer<typeof JWTPayloadSchema>;

export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is required in production');
    }
    return 'secret_for_tests';
  }
  return secret;
};

export const signJwt = (payload: Omit<JWTPayload, 'iat' | 'exp'>, expiresIn: string | number = '7d'): string => {
  return jwt.sign(payload, getJwtSecret(), { expiresIn });
};

export const verifyJwt = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    return JWTPayloadSchema.parse(decoded);
  } catch {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid or expired token' });
  }
};

export const readTokenFromRequest = (req: any): string | null => {
  const shopCookie = req?.cookies?.shop_auth_token as string | undefined;
  if (shopCookie) return shopCookie;
  const cookieToken = req?.cookies?.auth_token as string | undefined;
  if (cookieToken) return cookieToken;
  const header = req?.headers?.authorization as string | undefined;
  if (header?.startsWith('Bearer ')) return header.replace('Bearer ', '');
  return null;
};


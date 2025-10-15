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
    // Align with admin login signer fallback in admin-rest.ts
    return 'jeeey_fallback_secret_change_me';
  }
  return secret;
};

const getJwtSecrets = (): string[] => {
  const primary = getJwtSecret();
  const fallbacksRaw = process.env.JWT_SECRET_FALLBACKS || process.env.JWT_SECRET_ALT || '';
  const extras = fallbacksRaw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => !!s && s !== primary);
  return [primary, ...extras];
};

export const signJwt = (payload: Omit<JWTPayload, 'iat' | 'exp'>, expiresIn: string | number = '7d'): string => {
  return jwt.sign(payload, getJwtSecret(), { expiresIn });
};

export const verifyJwt = (token: string): JWTPayload => {
  const secrets = getJwtSecrets();
  for (const s of secrets) {
    try {
      const decoded = jwt.verify(token, s);
      return JWTPayloadSchema.parse(decoded);
    } catch {}
  }
  throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid or expired token' });
};

export const readTokenFromRequest = (req: any): string | null => {
  // Prefer Authorization header (fresh token from OTP verify) over cookies to avoid stale cookie shadowing
  const header = req?.headers?.authorization as string | undefined;
  if (header?.startsWith('Bearer ')) return header.replace('Bearer ', '');
  const shopCookie = req?.cookies?.shop_auth_token as string | undefined;
  if (shopCookie) return shopCookie;
  const cookieToken = req?.cookies?.auth_token as string | undefined;
  if (cookieToken) return cookieToken;
  return null;
};

// Admin-only token reader: ignores shop cookie to avoid USER token shadowing ADMIN
export const readAdminTokenFromRequest = (req: any): string | null => {
  // Prefer explicit admin cookie
  const cookieToken = req?.cookies?.auth_token as string | undefined;
  if (cookieToken) return cookieToken;
  // Accept Authorization header if present
  const header = req?.headers?.authorization as string | undefined;
  if (header?.startsWith('Bearer ')) return header.replace('Bearer ', '');
  // Do NOT read shop_auth_token here
  return null;
};


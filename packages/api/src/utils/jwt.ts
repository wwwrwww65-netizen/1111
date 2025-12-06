import jwt from 'jsonwebtoken';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

const JWTPayloadSchema = z.object({
  userId: z.string(),
  // Email is optional now to support phone-only (WhatsApp) accounts
  // Relaxed validation to allow 'phone+number@local' which might fail strict email regex
  email: z.string().optional().or(z.literal('')),
  // Optional phone E.164-ish (we don't strictly validate format here)
  phone: z.string().optional(),
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
  // As a last-resort compatibility with older admin-issued tokens, try the admin fallback secret
  const adminFallback = 'jeeey_fallback_secret_change_me';
  const withAdmin = adminFallback && adminFallback !== primary && !extras.includes(adminFallback)
    ? [...extras, adminFallback]
    : extras;
  return [primary, ...withAdmin];
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
    } catch (e) {
    }
  }
  throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid or expired token' });
};

export const readTokenFromRequest = (req: any): string | null => {
  // Prefer Authorization header (fresh token from OTP verify) over cookies to avoid stale cookie shadowing
  const header = req?.headers?.authorization as string | undefined;
  if (header?.startsWith('Bearer ')) return header.replace('Bearer ', '');
  // Accept explicit auth token headers used by mobile/WebView bridges
  const xAuth = (req?.headers?.['x-auth-token'] as string | undefined) || (req?.headers?.['x-access-token'] as string | undefined);
  if (typeof xAuth === 'string' && xAuth.trim()) return xAuth.trim();
  const shopCookie = req?.cookies?.shop_auth_token as string | undefined;
  if (shopCookie) return shopCookie;
  const cookieToken = req?.cookies?.auth_token as string | undefined;
  if (cookieToken) return cookieToken;
  // Fallbacks commonly set by native bridges
  const access = req?.cookies?.access_token as string | undefined;
  if (access) return access;
  const generic = (req?.cookies?.token as string | undefined) || (req?.cookies?.jwt as string | undefined);
  if (generic) return generic;
  // Final fallback: query token ?t=... (used by OAuth callback flows and diagnostics)
  try {
    const q = String(req?.query?.t || '').trim();
    if (q) return q;
  } catch { }
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


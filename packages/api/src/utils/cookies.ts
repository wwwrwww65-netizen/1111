import type { Response } from 'express';

const COOKIE_NAME = 'auth_token';

export const setAuthCookies = (res: Response, token: string, remember = false): void => {
  const maxAge = remember ? 30 * 24 * 60 * 60 * 1000 : undefined;
  const isProd = process.env.NODE_ENV === 'production';
  // In development/local HTTP, allow non-secure cookies so localhost works
  const base: any = { httpOnly: true, secure: isProd, sameSite: isProd ? 'none' : 'lax', path: '/', ...(maxAge ? { maxAge } : {}) };
  let domain = process.env.COOKIE_DOMAIN as string | undefined;
  if (!domain && process.env.NODE_ENV === 'production') {
    domain = '.jeeey.com';
  }
  if (domain) {
    res.cookie(COOKIE_NAME, token, { ...base, domain });
  } else {
    res.cookie(COOKIE_NAME, token, base);
  }
  // Host-only fallback with Lax for top-level navigations
  const hostOnly: any = { ...base };
  delete hostOnly.domain;
  hostOnly.sameSite = 'lax';
  res.cookie(COOKIE_NAME, token, hostOnly);
};

export const clearAuthCookies = (res: Response): void => {
  // Clear host-only
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie(COOKIE_NAME, { httpOnly: true, secure: isProd, sameSite: isProd ? 'none' : 'lax', path: '/' });
  // Clear cross-domain variant if domain configured or use a sensible default
  let domain = process.env.COOKIE_DOMAIN as string | undefined;
  if (!domain && process.env.NODE_ENV === 'production') {
    domain = '.jeeey.com';
  }
  if (domain) {
    res.clearCookie(COOKIE_NAME, { httpOnly: true, secure: isProd, sameSite: isProd ? 'none' : 'lax', path: '/', domain });
  }
};


import type { Response } from 'express';

const COOKIE_NAME = 'auth_token';

export const setAuthCookies = (res: Response, token: string, remember = false): void => {
  const maxAge = remember ? 30 * 24 * 60 * 60 * 1000 : undefined;
  const base: any = { httpOnly: true, secure: true, sameSite: 'none', path: '/', ...(maxAge ? { maxAge } : {}) };
  const domain = process.env.COOKIE_DOMAIN;
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
  res.clearCookie(COOKIE_NAME, { httpOnly: true, secure: true, sameSite: 'lax', path: '/' });
  // Clear cross-domain variant if domain configured or use a sensible default
  const domain = process.env.COOKIE_DOMAIN;
  if (domain) {
    res.clearCookie(COOKIE_NAME, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', domain });
  }
};


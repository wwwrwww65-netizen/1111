import { NextResponse } from 'next/server';

export async function GET(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token') || '';
    const remember = url.searchParams.get('remember') === 'true';
    const next = url.searchParams.get('next') || '/';
    if (!token) {
      return NextResponse.redirect(new URL('/login', url));
    }
    const res = NextResponse.redirect(new URL(next, url));
    const maxAge = remember ? 30 * 24 * 60 * 60 : undefined;
    // Compute shared domain (e.g., .jeeey.com) to allow API subdomain to see cookie
    const host = url.host;
    let domain: string | undefined = process.env.COOKIE_DOMAIN;
    if (!domain && host.includes('.')) {
      const parts = host.split('.');
      if (parts.length >= 2) domain = `.${parts.slice(-2).join('.')}`;
    }
    res.headers.append('Set-Cookie', `auth_token=${encodeURIComponent(token)}; Path=/; SameSite=Lax; ${domain? `Domain=${domain}; `: ''}${maxAge ? `Max-Age=${maxAge}; ` : ''}${process.env.NODE_ENV === 'production' ? 'Secure; ' : ''}HttpOnly`);
    return res;
  } catch {
    return NextResponse.redirect(new URL('/login', req.url));
  }
}


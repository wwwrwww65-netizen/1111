import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { token, remember } = await req.json();
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'token_required' }, { status: 400 });
    }
    const maxAge = remember ? 30 * 24 * 60 * 60 : undefined;
    // Use shared cookie domain for subdomains (e.g., .jeeey.com) so API receives the auth cookie
    const host = req.headers.get('host') || '';
    let domain = process.env.COOKIE_DOMAIN as string | undefined;
    if (!domain && host.includes('.')) {
      const parts = host.split('.');
      if (parts.length >= 2) domain = `.${parts.slice(-2).join('.')}`; // e.g., admin.jeeey.com -> .jeeey.com
    }
    cookies().set('auth_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      ...(domain ? { domain } : {}),
      ...(maxAge ? { maxAge } : {}),
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
}


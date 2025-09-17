import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { token, remember } = await req.json();
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'token_required' }, { status: 400 });
    }
    const maxAge = remember ? 30 * 24 * 60 * 60 : undefined;
    // 1) Host-only cookie for admin subdomain navigations
    cookies().set('auth_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      ...(maxAge ? { maxAge } : {}),
    });
    // 2) Cross-subdomain cookie for api.<root>
    try {
      cookies().set('auth_token', token, {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        path: '/',
        domain: '.jeeey.com',
        ...(maxAge ? { maxAge } : {}),
      });
    } catch {}
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
}


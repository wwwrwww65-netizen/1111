import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  // Allow login and static assets
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.startsWith('/api') || pathname === '/login' || pathname.startsWith('/(auth)')) {
    return NextResponse.next();
  }
  const hasToken = req.cookies.get('auth_token');
  if (!hasToken) {
    const url = req.nextUrl.clone();
    url.pathname = '/(auth)/login';
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api).*)',
  ],
};


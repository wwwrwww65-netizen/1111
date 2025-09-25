import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const ua = (req.headers.get('user-agent') || '').toLowerCase();
  const isMobileUA = /(android|iphone|ipad|ipod|mobile|blackberry|iemobile|opera mini)/.test(ua);
  const forceDesktopCookie = req.cookies.get('admin_force_desktop')?.value === '1';
  // Allow login and static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api') || // includes /api/admin proxy and /api/auth/set
    pathname === '/bridge' ||
    pathname.startsWith('/_debug') || pathname.startsWith('/debug') ||
    pathname === '/login' ||
    pathname.startsWith('/(auth)')
  ) {
    return NextResponse.next();
  }
  const hasToken = req.cookies.get('auth_token');
  if (!hasToken) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  // Redirect root to /mobile for mobile user agents unless user forced desktop
  if (!forceDesktopCookie && isMobileUA) {
    if (pathname === '/' && !pathname.startsWith('/mobile')) {
      const url = req.nextUrl.clone();
      url.pathname = '/mobile';
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|favicon|api).*)'],
};


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
  // Redirect common desktop paths to /mobile equivalents for mobile UAs (unless forced desktop)
  if (!forceDesktopCookie && isMobileUA) {
    if (!pathname.startsWith('/mobile')) {
      const directPrefixes = [
        '/orders','/products','/vendors','/users','/categories',
        '/drivers','/carriers','/shipments',
        '/logistics/pickup','/logistics/warehouse','/logistics/delivery',
        '/coupons','/audit-logs'
      ];
      const startsWithAny = directPrefixes.find(p => pathname === p || pathname.startsWith(p + '/'));
      const url = req.nextUrl.clone();
      if (pathname === '/') {
        url.pathname = '/mobile';
        return NextResponse.redirect(url);
      } else if (startsWithAny) {
        url.pathname = '/mobile' + pathname;
        return NextResponse.redirect(url);
      } else if (pathname.startsWith('/finance')) {
        url.pathname = '/mobile/finance';
        return NextResponse.redirect(url);
      } else if (pathname.startsWith('/inventory')) {
        url.pathname = '/mobile/inventory';
        return NextResponse.redirect(url);
      } else if (pathname.startsWith('/warehouses')) {
        url.pathname = '/mobile/logistics/warehouse';
        return NextResponse.redirect(url);
      } else if (pathname.startsWith('/notifications')) {
        url.pathname = '/mobile/notifications';
        return NextResponse.redirect(url);
      } else if (pathname.startsWith('/settings/rbac')) {
        url.pathname = '/mobile/settings/rbac';
        return NextResponse.redirect(url);
      }
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|favicon|api).*)'],
};


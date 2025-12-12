import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // Get the user agent from headers
    const userAgent = request.headers.get('user-agent') || ''

    // Define mobile device regex
    // This matches common mobile devices including iPhone, Android, iPad, etc.
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)

    // Only redirect if it is a mobile device
    if (isMobile) {
        const url = request.nextUrl.clone()

        // Set the hostname to the mobile site
        url.hostname = 'm.jeeey.com'
        url.protocol = 'https'
        url.port = '' // Remove port if present (e.g. 3000)

        // Redirect to the same path and query on the mobile subdomain
        return NextResponse.redirect(url)
    }

    // Continue normally if not mobile
    return NextResponse.next()
}

export const config = {
    // Match all request paths except for:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - robots.txt
    // - public folder assets might be handled by _next/static exception or handled by Nginx
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
    ],
}

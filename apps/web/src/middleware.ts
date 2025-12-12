import { NextResponse, userAgent } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const { device } = userAgent(request)

    // Check if the device is mobile
    // Use modern userAgent parsing provided by Next.js
    if (device.type === 'mobile') {
        const url = request.nextUrl.clone()

        // Redirect to the mobile subdomain
        url.hostname = 'm.jeeey.com'
        url.protocol = 'https'
        url.port = '' // Ensure port is cleared for production URL

        return NextResponse.redirect(url)
    }

    return NextResponse.next()
}

export const config = {
    // Match all request paths except for:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - robots.txt
    // - sitemap.xml
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
    ],
}

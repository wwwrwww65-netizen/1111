import { NextResponse } from 'next/server'

function computeApiBase(req: Request): string {
    const internal = process.env.INTERNAL_API_URL || ''
    if (internal) return internal
    const env = process.env.NEXT_PUBLIC_API_BASE_URL || ''
    if (env) {
        return env.endsWith('/trpc') ? env.slice(0, -5) : env
    }
    try {
        const u = new URL(req.url)
        const host = u.host
        // Prefer local API on same server to avoid external NGINX hops
        if (host.includes('jeeey.com') || process.env.NODE_ENV === 'production') {
            return 'http://127.0.0.1:4000'
        }
        const proto = u.protocol
        if (host.startsWith('admin.')) {
            return `${proto}//api.${host.slice('admin.'.length)}`
        }
        return `${proto}//${host}`.replace('//admin.', '//api.')
    } catch {
        return 'http://127.0.0.1:4000'
    }
}

async function proxy(req: Request, ctx: { params: { path?: string[] } }) {
	const path = (ctx.params?.path || []).join('/')
	const apiBase = computeApiBase(req)
	const targetUrl = `${apiBase}/api/admin/${path}${req.url.includes('?') ? '?' + new URL(req.url).searchParams.toString() : ''}`

	const headers = new Headers()
	// Forward essential headers
	for (const [k, v] of req.headers.entries()) {
		if (k.toLowerCase() === 'host') continue
		headers.set(k, v)
	}
	// Ensure credentials/cookies are forwarded
	const cookie = req.headers.get('cookie')
	if (cookie) headers.set('cookie', cookie)

	const init: RequestInit = {
		method: req.method,
		headers,
		redirect: 'manual',
	}
	if (!['GET', 'HEAD'].includes(req.method)) {
		init.body = await req.arrayBuffer()
	}
	let upstream: Response
	try {
		upstream = await fetch(targetUrl, init)
	} catch (e) {
		return NextResponse.json({ error: 'upstream_unreachable', detail: (e as Error)?.message || '' }, { status: 502 })
	}

	// Build response, passing through headers (including set-cookie)
	const resHeaders = new Headers()
	upstream.headers.forEach((v, k) => {
		if (['content-length', 'content-encoding'].includes(k.toLowerCase())) return
		resHeaders.set(k, v)
	})
	const setCookie = upstream.headers.get('set-cookie')
	if (setCookie) resHeaders.append('set-cookie', setCookie)

	return new Response(upstream.body, { status: upstream.status, headers: resHeaders })
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const PATCH = proxy
export const DELETE = proxy
export const OPTIONS = proxy
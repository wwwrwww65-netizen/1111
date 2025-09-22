import { NextResponse, cookies as nextCookies } from 'next/server'

function computeApiBase(req: Request): string {
    const internal = process.env.INTERNAL_API_URL || ''
    if (internal) return internal
    const env = process.env.NEXT_PUBLIC_API_BASE_URL || ''
    if (env) {
        // Prefer internal on prod to avoid 502 from external hops
        if (process.env.NODE_ENV === 'production') return 'http://127.0.0.1:4000'
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

export const runtime = 'nodejs'

async function proxy(req: Request, ctx: { params: { path?: string[] } }) {
	const path = (ctx.params?.path || []).join('/')
	const apiBase = computeApiBase(req)
	const search = (()=>{ try { return new URL(req.url).searchParams.toString() } catch { return '' } })()
	const targetUrl = `${apiBase}/api/admin/${path}${search ? `?${search}` : ''}`

	const headers = new Headers()
	// Forward essential headers
	for (const [k, v] of req.headers.entries()) {
		if (k.toLowerCase() === 'host') continue
		headers.set(k, v)
	}
	// Ensure credentials/cookies are forwarded
	const cookie = req.headers.get('cookie')
	if (cookie) headers.set('cookie', cookie)
	// Promote cookie auth_token to Authorization for API admin REST
	try {
		const tokenMatch = /(?:^|; )auth_token=([^;]+)/.exec(cookie || '')
		if (tokenMatch && !headers.get('authorization')) {
			const token = decodeURIComponent(tokenMatch[1])
			headers.set('authorization', `Bearer ${token}`)
		}
	} catch {}

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
		if (upstream.status === 502 || upstream.status === 503) {
			// Fallback once to public API base if internal unreachable
			const publicBase = process.env.NEXT_PUBLIC_API_BASE_URL || apiBase
			const alt = `${publicBase.replace(/\/$/, '')}/api/admin/${path}${search ? `?${search}` : ''}`
			upstream = await fetch(alt, init)
		}
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
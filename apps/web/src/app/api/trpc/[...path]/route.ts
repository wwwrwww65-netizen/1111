import { NextResponse } from 'next/server'

function computeApiBase(req: Request): string {
  const env = process.env.NEXT_PUBLIC_TRPC_URL || ''
  if (env) return env.replace(/\/$/, '')
  try {
    const u = new URL(req.url)
    const host = u.host.split(':')[0]
    const parts = host.split('.')
    const apex = parts.length >= 2 ? parts.slice(-2).join('.') : host
    // In production, always use public API domain
    if (process.env.NODE_ENV === 'production') return `https://api.${apex}/trpc`
    // In non-production, derive from current protocol
    const proto = (u.protocol === 'http:' || u.protocol === 'https:') ? u.protocol : 'http:'
    return `${proto}//api.${apex}/trpc`
  } catch {
    // Safe fallback to public API
    return 'https://api.jeeey.com/trpc'
  }
}

export const runtime = 'nodejs'

async function proxy(req: Request, ctx: { params: { path?: string[] } }) {
  const path = (ctx.params?.path || []).join('/')
  const base = computeApiBase(req)
  const search = (()=>{ try { return new URL(req.url).searchParams.toString() } catch { return '' } })()
  const targetUrl = `${base}/${path}${search ? `?${search}` : ''}`

  const headers = new Headers()
  for (const [k, v] of req.headers.entries()) {
    if (k.toLowerCase() === 'host') continue
    headers.set(k, v)
  }
  const cookie = req.headers.get('cookie')
  if (cookie) headers.set('cookie', cookie)

  const init: RequestInit = { method: req.method, headers, redirect: 'manual' }
  if (!['GET','HEAD'].includes(req.method)) init.body = await req.arrayBuffer()

  let upstream: Response
  try {
    upstream = await fetch(targetUrl, init)
  } catch (e) {
    return NextResponse.json({ error: 'upstream_unreachable', detail: (e as Error)?.message || '' }, { status: 502 })
  }

  const resHeaders = new Headers()
  upstream.headers.forEach((v, k) => {
    if (['content-length','content-encoding'].includes(k.toLowerCase())) return
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


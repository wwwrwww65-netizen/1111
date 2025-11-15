const VITE_BASE = (import.meta as any)?.env?.VITE_API_BASE
let LOCAL_BASE = 'https://api.jeeey.com'
try {
  const host = typeof window !== 'undefined' ? window.location.hostname : ''
  const isLocal = host === 'localhost' || host === '127.0.0.1'
  if (isLocal) LOCAL_BASE = 'http://localhost:4000'
} catch {}
export const API_BASE = VITE_BASE || LOCAL_BASE

// Lightweight client-side de-duplication and short-lived cache for public GETs
// Prevents duplicate concurrent requests and reduces network chatter on home
const inFlight: Map<string, Promise<any>> = new Map()
type CacheEntry = { ts: number; data: any }
const shortCache: Map<string, CacheEntry> = new Map()
const CACHE_TTL_MS = 15000 // 15s for public resources

function getAuthHeader(): Record<string,string> {
  try {
    const out: Record<string,string> = {}
    // Prefer client-stored token to bypass 3P cookie blocking
    if (typeof window !== 'undefined') {
      try {
        const lt = window.localStorage?.getItem('shop_token')
        if (lt && lt.trim()) out.Authorization = `Bearer ${lt}`
      } catch {}
      try {
        const st = window.sessionStorage?.getItem('shop_token')
        if (!out.Authorization && st && st.trim()) out.Authorization = `Bearer ${st}`
      } catch {}
    }
    // Always include session id for guest cart/linking consistency (even when authenticated)
    try{
      const sid = typeof window!=='undefined' ? (window.localStorage?.getItem('sid_v1') || '') : ''
      if (sid && sid.trim()) out['X-Session-Id'] = sid
    }catch{}
    // Fallback: try cookies (may fail if httpOnly or 3P cookies blocked)
    if (!out.Authorization) {
      const raw = typeof document !== 'undefined' ? document.cookie || '' : ''
      const mShop = /(?:^|; )shop_auth_token=([^;]+)/.exec(raw)
      const mAdmin = /(?:^|; )auth_token=([^;]+)/.exec(raw)
      const tok = mShop?.[1] || mAdmin?.[1]
      if (tok) out.Authorization = `Bearer ${decodeURIComponent(tok)}`
    }
    return out
  } catch { return {} }
}

export function googleLoginUrl(next: string = '/account'): string {
	const dest = next && next.startsWith('/') ? next : '/account'
  // ru: URL مطلق للعودة لنفس الأصل (المجال الفرعي الحالي) لتجنب الرجوع إلى نطاق غير صحيح
  let ru = ''
  try { if (typeof window!=='undefined') ru = `${window.location.origin}${dest}` } catch {}
	const qs = new URLSearchParams({ next: dest, ...(ru? { ru }: {}) }).toString()
	return `${API_BASE}/api/auth/google/login?${qs}`
}

export function facebookLoginUrl(next: string = '/account'): string {
	const dest = next && next.startsWith('/') ? next : '/account'
  let ru = ''
  try { if (typeof window!=='undefined') ru = `${window.location.origin}${dest}` } catch {}
	const qs = new URLSearchParams({ next: dest, ...(ru? { ru }: {}) }).toString()
	return `${API_BASE}/api/auth/facebook/login?${qs}`
}

export async function apiGet<T = any>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const url = path.startsWith('http') ? path : `${API_BASE}${path}`
    const isPublic = /^\/api\/(products|categories|search|product|catalog)/.test(path)
    const headers = { 'Accept': 'application/json', 'X-Shop-Client': 'mweb', ...getAuthHeader(), ...(init?.headers||{}) }
    const key = isPublic ? url : '' // only cache public GETs
    if (key) {
      const c = shortCache.get(key)
      if (c && (Date.now() - c.ts) < CACHE_TTL_MS) return c.data as T
      const inflight = inFlight.get(key)
      if (inflight) return inflight as Promise<T|null>
      const p = (async () => {
        const res = await fetch(url, { ...init, credentials: 'omit', headers })
        if(!res.ok) return null
        const data = await res.json()
        shortCache.set(key, { ts: Date.now(), data })
        inFlight.delete(key)
        return data as T
      })()
      inFlight.set(key, p)
      return await p
    }
    const res = await fetch(url, { ...init, credentials: isPublic ? 'omit' : 'include', headers })
    if(!res.ok) return null
    return await res.json()
  } catch { return null }
}

export async function apiPost<T = any>(path: string, body?: any, init?: RequestInit): Promise<T | null> {
  try {
    const url = path.startsWith('http') ? path : `${API_BASE}${path}`
    // Public posts (no cookies) to avoid CORS issues from first-party pages
    const isPublic = /^\/api\/auth\/otp\/request/.test(path) || /^\/api\/events(\/|$)?/.test(path) || /^\/api\/tabs\/track/.test(path) || /^\/api\/promotions\/claim\/start/.test(path)
    const res = await fetch(url, { method:'POST', headers: { 'content-type':'application/json', ...getAuthHeader(), ...(init?.headers||{}) }, credentials: isPublic ? 'omit' : 'include', body: body==null?undefined: JSON.stringify(body) })
    if(!res.ok) return null
    return await res.json()
  } catch { return null }
}


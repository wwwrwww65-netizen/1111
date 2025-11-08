const VITE_BASE = (import.meta as any)?.env?.VITE_API_BASE
let LOCAL_BASE = 'https://api.jeeey.com'
try {
  const host = typeof window !== 'undefined' ? window.location.hostname : ''
  const isLocal = host === 'localhost' || host === '127.0.0.1'
  if (isLocal) LOCAL_BASE = 'http://localhost:4000'
} catch {}
export const API_BASE = VITE_BASE || LOCAL_BASE

function getAuthHeader(): Record<string,string> {
  try {
    // Prefer client-stored token to bypass 3P cookie blocking
    if (typeof window !== 'undefined') {
      try {
        const lt = window.localStorage?.getItem('shop_token')
        if (lt && lt.trim()) return { Authorization: `Bearer ${lt}` }
      } catch {}
      try {
        const st = window.sessionStorage?.getItem('shop_token')
        if (st && st.trim()) return { Authorization: `Bearer ${st}` }
      } catch {}
    }
    // Fallback: try cookies (may fail if httpOnly or 3P cookies blocked)
    const raw = typeof document !== 'undefined' ? document.cookie || '' : ''
    const mShop = /(?:^|; )shop_auth_token=([^;]+)/.exec(raw)
    const mAdmin = /(?:^|; )auth_token=([^;]+)/.exec(raw)
    const tok = mShop?.[1] || mAdmin?.[1]
    if (tok) return { Authorization: `Bearer ${decodeURIComponent(tok)}` }
  } catch {}
  return {}
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
    const res = await fetch(url, { ...init, credentials: isPublic ? 'omit' : 'include', headers: { 'Accept': 'application/json', 'X-Shop-Client': 'mweb', ...getAuthHeader(), ...(init?.headers||{}) } })
    if(!res.ok) return null
    return await res.json()
  } catch { return null }
}

export async function apiPost<T = any>(path: string, body?: any, init?: RequestInit): Promise<T | null> {
  try {
    const url = path.startsWith('http') ? path : `${API_BASE}${path}`
    // Only the OTP request should omit credentials to simplify CORS; OTP verify must include credentials to receive auth cookie
    const isPublic = /^\/api\/auth\/otp\/request/.test(path)
    const res = await fetch(url, { method:'POST', headers: { 'content-type':'application/json', ...getAuthHeader(), ...(init?.headers||{}) }, credentials: isPublic ? 'omit' : 'include', body: body==null?undefined: JSON.stringify(body) })
    if(!res.ok) return null
    return await res.json()
  } catch { return null }
}


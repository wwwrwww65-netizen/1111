export const API_BASE = (import.meta as any)?.env?.VITE_API_BASE || 'https://api.jeeey.com'

export function googleLoginUrl(next: string = '/account'): string {
	const dest = next && next.startsWith('/') ? next : '/account'
	const qs = new URLSearchParams({ next: dest }).toString()
	return `${API_BASE}/api/auth/google/login?${qs}`
}

export async function apiGet<T = any>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const url = path.startsWith('http') ? path : `${API_BASE}${path}`
    const isPublic = /^\/api\/(products|categories|search|product|catalog)/.test(path)
    const res = await fetch(url, { ...init, credentials: isPublic ? 'omit' : 'include', headers: { 'Accept': 'application/json', 'X-Shop-Client': 'mweb', ...(init?.headers||{}) } })
    if(!res.ok) return null
    return await res.json()
  } catch { return null }
}

export async function apiPost<T = any>(path: string, body?: any, init?: RequestInit): Promise<T | null> {
  try {
    const url = path.startsWith('http') ? path : `${API_BASE}${path}`
    // Only the OTP request should omit credentials to simplify CORS; OTP verify must include credentials to receive auth cookie
    const isPublic = /^\/api\/auth\/otp\/request/.test(path)
    const res = await fetch(url, { method:'POST', headers: { 'content-type':'application/json', ...(init?.headers||{}) }, credentials: isPublic ? 'omit' : 'include', body: body==null?undefined: JSON.stringify(body) })
    if(!res.ok) return null
    return await res.json()
  } catch { return null }
}


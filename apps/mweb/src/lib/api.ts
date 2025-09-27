export const API_BASE = (import.meta as any)?.env?.VITE_API_BASE || 'https://api.jeeey.com'

export async function apiGet<T = any>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const url = path.startsWith('http') ? path : `${API_BASE}${path}`
    const isPublic = /^\/api\/(products|categories|search|product|catalog)/.test(path)
    const res = await fetch(url, { ...init, credentials: isPublic ? 'omit' : 'include', headers: { 'Accept': 'application/json', ...(init?.headers||{}) } })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function apiPost<T = any>(path: string, body?: any, init?: RequestInit): Promise<T | null> {
  try {
    const url = path.startsWith('http') ? path : `${API_BASE}${path}`
    const isPublic = /^\/api\/(auth\/otp\/(request|verify))/.test(path)
    const res = await fetch(url, { method:'POST', credentials: isPublic ? 'omit' : 'include', headers: { 'Accept':'application/json', 'Content-Type':'application/json', ...(init?.headers||{}) }, body: body!=null ? JSON.stringify(body) : undefined, ...init })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}


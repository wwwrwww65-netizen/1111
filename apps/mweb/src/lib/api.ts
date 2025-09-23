export const API_BASE = (import.meta as any)?.env?.VITE_API_BASE || 'https://api.jeeey.com'

export async function apiGet<T = any>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const url = path.startsWith('http') ? path : `${API_BASE}${path}`
    const res = await fetch(url, { ...init, headers: { 'Accept': 'application/json', ...(init?.headers||{}) } })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}


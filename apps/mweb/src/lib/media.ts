import { API_BASE } from './api'

export function buildThumbUrl(src: string, width: number, quality = 60): string {
  try{
    const s = String(src||'').trim()
    if (!s) return s
    // Normalize API uploads and absolute URLs
    let u = s
    if (s.startsWith('/uploads/')) u = `${API_BASE}${s}`
    // Pass only API uploads to thumbnailer; external URLs fallback to original
    const api = (API_BASE||'').replace(/\/+$/,'')
    if (u.startsWith(`${api}/uploads/`)) {
      const url = new URL(`${api}/api/media/thumb`)
      url.searchParams.set('src', u)
      url.searchParams.set('w', String(Math.max(64, Math.min(1200, width||512))))
      url.searchParams.set('q', String(Math.max(40, Math.min(85, quality||60))))
      return url.toString()
    }
    return u
  }catch{ return src }
}



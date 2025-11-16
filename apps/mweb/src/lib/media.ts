import { API_BASE } from './api'

export function buildThumbUrl(src: string, width: number, quality = 60): string {
  try{
    const s = String(src||'').trim()
    if (!s) return s
    // Prefer same-origin thumbnail proxy (/i) for images (uploads or absolute http URLs)
    const api = (API_BASE||'').replace(/\/+$/,'')
    const isUpload = s.startsWith('/uploads/') || s.startsWith(`${api}/uploads/`)
    const isHttp = /^https?:\/\//i.test(s)
    if ((isUpload || isHttp) && typeof window !== 'undefined'){
      const url = new URL('/i', window.location.origin)
      url.searchParams.set('src', s)
      url.searchParams.set('w', String(Math.max(64, Math.min(1200, width||512))))
      url.searchParams.set('q', String(Math.max(40, Math.min(85, quality||60))))
      return url.toString()
    }
    // Fallback to API direct path when uploads without window context (SSR)
    if (s.startsWith('/uploads/')) {
      const url = new URL(`${api}/api/media/thumb`)
      url.searchParams.set('src', s)
      url.searchParams.set('w', String(Math.max(64, Math.min(1200, width||512))))
      url.searchParams.set('q', String(Math.max(40, Math.min(85, quality||60))))
      return url.toString()
    }
    return s
  }catch{ return src }
}



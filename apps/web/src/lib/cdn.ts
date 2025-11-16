export type ImageFormat = 'webp' | 'avif'

export function buildCdnThumb(src: string, width: number, quality = 60, format: ImageFormat = 'webp'): string {
	try{
		const s = String(src||'').trim()
		if (!s) return ''
		// Only proxy our uploads; leave external hosts as-is
		const api = 'https://api.jeeey.com'
		const isUpload = s.startsWith('/uploads/') || s.startsWith(`${api}/uploads/`)
		if (!isUpload) return s
		const url = new URL('/i', window.location.origin)
		url.searchParams.set('src', s)
		url.searchParams.set('w', String(Math.max(64, Math.min(1200, width||512))))
		url.searchParams.set('q', String(Math.max(40, Math.min(85, quality||60))))
		url.searchParams.set('fm', format === 'avif' ? 'avif' : 'webp')
		return url.toString()
	}catch{ return src }
}



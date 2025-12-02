export type ImageFormat = 'webp' | 'avif'

export function buildCdnThumb(src: string, width: number, quality = 60, format: ImageFormat = 'webp'): string {
	try{
		const s = String(src||'').trim()
		if (!s) return ''
		// Accept absolute uploads on API or relative /uploads
		// Keep other hosts untouched to avoid proxying third-party
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

export function buildCdnSrcSet(src: string, widths: number[] = [256,384,512,768], quality = 60, format: ImageFormat = 'webp'): string {
	try{
		return widths.map(w => `${buildCdnThumb(src, w, quality, format)} ${w}w`).join(', ')
	}catch{ return '' }
}



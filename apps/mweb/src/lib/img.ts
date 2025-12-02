import { API_BASE } from './api'

export function buildSrc(url?: string|null, width?: number): string {
	const src = String(url||'')
	if (!src) return ''
	const w = width && width>0 ? width : 800
	const u = new URL(API_BASE + '/api/admin/media/optimize')
	u.searchParams.set('src', src)
	u.searchParams.set('w', String(w))
	return u.toString()
}

export function buildSrcSet(url?: string|null, widths: number[] = [480, 720, 960, 1200]): string {
	const src = String(url||'')
	if (!src) return ''
	return widths.map(w=> `${buildSrc(src, w)} ${w}w`).join(', ')
}



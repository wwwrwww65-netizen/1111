// Small helper to load echarts safely on client only
export async function ensureEcharts(): Promise<any> {
	if (typeof window === 'undefined') throw new Error('echarts is client-only');
	// dynamic import to include in bundle and avoid insecure CDN
	const mod = await import('echarts');
	return mod.default || (mod as any);
}

export async function ensureEcharts(): Promise<any> {
	// If already loaded (via bundler or prior script), return it
	if (typeof window !== 'undefined' && (window as any).echarts) {
		return (window as any).echarts;
	}
	// Prefer local pinned asset if hosted; fallback to pinned CDN
	const candidates = [
		'/vendor/echarts@5.5.0/echarts.min.js',
		'https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js',
	];
	for (const src of candidates) {
		try {
			await new Promise<void>((resolve, reject) => {
				const s = document.createElement('script');
				s.src = src;
				s.async = true;
				s.crossOrigin = 'anonymous';
				s.referrerPolicy = 'no-referrer';
				s.onload = () => resolve();
				s.onerror = () => reject(new Error('load_failed'));
				document.body.appendChild(s);
			});
			if ((window as any).echarts) return (window as any).echarts;
		} catch {
			/* try next */
		}
	}
	throw new Error('echarts_unavailable');
}



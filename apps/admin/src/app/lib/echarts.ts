// Small helper to load echarts safely on client only
export async function ensureEcharts(): Promise<any> {
	if (typeof window === 'undefined') throw new Error('echarts is client-only');
	// dynamic import to include in bundle and avoid insecure CDN
	const mod = await import('echarts');
	return mod.default || (mod as any);
}





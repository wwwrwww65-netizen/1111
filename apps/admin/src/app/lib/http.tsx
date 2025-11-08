export type ApiError = { ok: false; status: number; message: string; code?: string };

export type SafeJson<T = any> = { ok: true; data: T } | ApiError;

export async function safeFetchJson<T = any>(input: string | URL | Request, init?: RequestInit & { parseAs?: 'json'|'text' }): Promise<SafeJson<T>> {
	// Always include credentials for admin app
	const req: RequestInit = { credentials: 'include', ...(init || {}) };
	try {
		const res = await fetch(input, req);
		if (!res.ok) {
			let message = `HTTP ${res.status}`;
			try {
				const ct = res.headers.get('content-type') || '';
				if (ct.includes('application/json')) {
					const j = await res.json().catch(()=> ({}));
					const m = (j && (j.message || j.error)) ? String(j.message || j.error) : '';
					if (m) message = m;
				} else {
					const t = await res.text().catch(()=> '');
					if (t) message = t.slice(0, 200);
				}
			} catch {}
			return { ok: false, status: res.status, message };
		}
		const parseAs = (init as any)?.parseAs || 'json';
		const data = (parseAs === 'text') ? await res.text() : await res.json();
		return { ok: true, data: data as T };
	} catch (e: any) {
		return { ok: false, status: 0, message: 'network_error' };
	}
}

export function buildUrl(base: string, params?: Record<string, any>): string {
	const u = new URL(base, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
	if (params) {
		for (const [k, v] of Object.entries(params)) {
			if (v === undefined || v === null || v === '') continue;
			u.searchParams.set(k, String(v));
		}
	}
	return u.toString();
}

export function errorView(message: string, onRetry?: ()=> void): JSX.Element {
	return (
		<div className="error" role="alert" aria-live="assertive" style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'space-between', padding:12 }}>
			<div>{message || 'فشل تحميل البيانات'}</div>
			{onRetry && <button className="btn btn-outline" onClick={onRetry}>إعادة المحاولة</button>}
		</div>
	) as unknown as JSX.Element;
}



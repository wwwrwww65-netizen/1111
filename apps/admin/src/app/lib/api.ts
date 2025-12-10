import { resolveApiBase } from './apiBase';

/**
 * Helper to get the auth token from cookies (client-side).
 */
export function getAuthToken(): string | null {
    if (typeof document === 'undefined') return null;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    if (m) {
        try {
            return decodeURIComponent(m[1]);
        } catch {
            return m[1];
        }
    }
    return null;
}

/**
 * Helper to get standard auth headers.
 */
export function getAuthHeaders(): Record<string, string> {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

type FetchOptions = Omit<RequestInit, 'body'> & {
    body?: BodyInit | object;
    params?: Record<string, string>;
};

/**
 * Wrapper around fetch that adds:
 * 1. Base URL resolution
 * 2. Auth headers
 * 3. Default JSON content-type (if body is object)
 * 4. Error handling
 */
export async function apiFetch<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const base = resolveApiBase();
    const token = getAuthToken();

    // Construct URL
    const url = new URL(endpoint.startsWith('http') ? endpoint : `${base}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`);
    if (options.params) {
        Object.entries(options.params).forEach(([k, v]) => {
            if (v !== undefined && v !== null) url.searchParams.append(k, String(v));
        });
    }

    // Headers
    const headers: Record<string, string> = {
        ...(options.headers as Record<string, string>),
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    // Auto JSON type
    if (options.body && typeof options.body !== 'string' && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(options.body);
    }

    // Execute
    const res = await fetch(url.toString(), {
        credentials: 'include', // Important for cookies if needed, though we use Bearer
        ...(options as RequestInit),
        headers,
    });

    // Handle Response
    if (!res.ok) {
        // Try to parse error
        let errorMsg = `Error ${res.status}: ${res.statusText}`;
        try {
            const json = await res.json();
            if (json.error || json.message) errorMsg = json.error || json.message;
        } catch { }
        throw new Error(errorMsg);
    }

    // Empty response handling
    if (res.status === 204) return {} as T;

    try {
        return await res.json();
    } catch {
        return {} as T;
    }
}

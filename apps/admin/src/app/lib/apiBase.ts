export function resolveApiBase(): string {
  let env = process.env.NEXT_PUBLIC_API_BASE_URL as string | undefined;
  if (env && env.trim()) {
    // Sanitize accidental /trpc suffix
    if (env.endsWith('/trpc')) env = env.slice(0, -5);
    return env;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.host;
    const hostname = window.location.hostname;
    // Local development: backend runs on 4000 by default
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:4000';
    }
    // Common pattern: admin.<root> -> api.<root>
    if (host.startsWith('admin.')) {
      return `${window.location.protocol}//api.${host.slice('admin.'.length)}`;
    }
    return `${window.location.protocol}//${host}`.replace('//admin.', '//api.');
  }
  return 'http://localhost:4000';
}


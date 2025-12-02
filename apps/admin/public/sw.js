const CACHE_NAME = 'jeeey-admin-v2';
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
});
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isApi = sameOrigin && url.pathname.startsWith('/api/');
  const isCrossOrigin = !sameOrigin;
  // Bypass: API calls and any cross-origin requests (e.g., http://localhost:4000)
  if (isApi || isCrossOrigin) return;
  // Only handle cache for static assets (Next.js/_next and typical asset destinations)
  const cacheable = url.pathname.startsWith('/_next/') || ['style','script','image','font'].includes(req.destination);
  if (!cacheable) return;
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((networkRes) => {
        try { const copy = networkRes.clone(); caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(()=>{}); } catch {}
        return networkRes;
      }).catch(() => cached || new Response('', { status: 504 }));
      return cached || fetchPromise;
    })
  );
});


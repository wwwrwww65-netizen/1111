const CACHE_NAME = 'jeeey-web-v2'; // Increment to clear old cache
const ASSETS = [
  '/',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  // Skip waiting to activate immediately
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim()) // Take control of all clients immediately
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only cache GET requests
  if (req.method !== 'GET') return;

  // Network-First strategy for HTML and API:
  // Try network first, fall back to cache only if offline.
  // This ensures users always get fresh content and don't get stuck with cached 500 errors.
  const isDoc = req.mode === 'navigate' || req.destination === 'document';
  const isApi = req.url.includes('/api/');

  if (isDoc || isApi) {
    event.respondWith(
      fetch(req).then((res) => {
        // Do NOT cache errors or bad responses
        if (!res || !res.ok || res.type !== 'basic') {
          return res;
        }
        return res;
      }).catch(() => {
        return caches.match(req);
      })
    );
    return;
  }

  // Stale-While-Revalidate for static assets (JS, CSS, Images)
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetched = fetch(req).then((res) => {
        if (!res || !res.ok || res.type !== 'basic') return res;
        // Cache successful static responses
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      }).catch(() => null); // If fetch fails, swallow error (we have cached)

      return cached || fetched;
    })
  );
});


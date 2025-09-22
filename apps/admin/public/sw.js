const CACHE_NAME = 'jeeey-admin-v1';
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
  event.respondWith(fetch(req).catch(() => caches.match(req)));
});


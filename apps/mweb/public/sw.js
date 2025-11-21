const CACHE_NAME = 'jeeey-mweb-v2-cleanup';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => Promise.all(
        keys.map((k) => caches.delete(k))
      ))
    ])
  );
});

self.addEventListener('fetch', (event) => {
  // Passthrough - no caching
  return;
});
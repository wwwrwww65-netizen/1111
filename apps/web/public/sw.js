const CACHE_NAME = 'jeeey-web-v2-cleanup';

self.addEventListener('install', (event) => {
  // Force immediate activation
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Take control of all clients immediately
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Delete all old caches
      caches.keys().then((keys) => Promise.all(
        keys.map((k) => caches.delete(k))
      ))
    ])
  );
});

self.addEventListener('fetch', (event) => {
  // Passthrough everything - do NOT cache anything
  // This effectively disables the service worker caching logic
  return;
});
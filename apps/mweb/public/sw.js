const CACHE_NAME = 'mweb-v3';
const ASSETS = [
  '/',
  '/index.html'
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c)=>c.addAll(ASSETS)));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Cache-First for static assets
  if (url.origin === location.origin && (url.pathname.startsWith('/assets/') || url.pathname === '/')) {
    e.respondWith(caches.match(e.request).then(res=>res||fetch(e.request).then((r)=>{const copy=r.clone();caches.open(CACHE_NAME).then(c=>c.put(e.request, copy));return r;})));
    return;
  }
  // Network-First for API
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
  }
});

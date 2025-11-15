self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Very small offline cache: stale-while-revalidate for uploads and static assets
const CACHE_NAME = 'mweb-v1';
const STATIC_REGEX = /\.(?:js|css|svg|woff2?|png|jpg|jpeg|webp|avif)$/i;

self.addEventListener('fetch', (event) => {
  try{
    const req = event.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    const isUploads = (url.hostname === 'api.jeeey.com' && url.pathname.startsWith('/uploads/')) ||
                      (url.origin === self.location.origin && url.pathname.startsWith('/uploads/'));
    const isThumbs = (url.hostname === 'api.jeeey.com' && url.pathname.startsWith('/api/media/thumb'));
    const isStatic = (url.origin === self.location.origin && (url.pathname.includes('/assets/') || STATIC_REGEX.test(url.pathname)));
    if (!(isUploads || isThumbs || isStatic)) return;
    event.respondWith((async ()=>{
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      const fetchPromise = fetch(req).then((res) => {
        try{ if (res && res.ok) cache.put(req, res.clone()); }catch(_){}
        return res;
      }).catch(()=> cached);
      return cached || fetchPromise;
    })());
  }catch{}
});


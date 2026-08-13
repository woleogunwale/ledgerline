/* Ledgerline service worker
   - HTML pages: network-first (updates show on reload when online), cache fallback offline.
   - Static files: cache-first.
   - Resilient install: caches each file independently so one missing/renamed file
     can NEVER break offline for the rest (this is the fix for iOS offline). */
const CACHE = 'ledgerline-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon-180.png'
];
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => Promise.allSettled(ASSETS.map(u => cache.add(u))))
      .then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
function isHTML(req) {
  return req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
}
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (isHTML(req)) {
    e.respondWith(
      fetch(req).then(res => {
        try {
          if (res && res.status === 200 && new URL(req.url).origin === self.location.origin) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put('./index.html', copy));
          }
        } catch (_) {}
        return res;
      }).catch(() =>
        caches.match(req).then(hit => hit || caches.match('./index.html'))
      )
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(hit =>
      hit || fetch(req).then(res => {
        try {
          if (res && res.status === 200 && new URL(req.url).origin === self.location.origin) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy));
          }
        } catch (_) {}
        return res;
      }).catch(() => undefined)
    )
  );
});

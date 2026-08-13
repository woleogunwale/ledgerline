/* Ledgerline service worker
   - HTML pages: network-first (so app updates appear on reload when online),
     falling back to cache when offline.
   - Icons/manifest/other static files: cache-first for speed & offline.
   Bumping CACHE forces a clean refresh of everything. */
const CACHE = 'ledgerline-v2';
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
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
function isHTML(req) {
  return req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html');
}
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (isHTML(req)) {
    // network-first: always try to get the latest page, fall back to cache offline
    e.respondWith(
      fetch(req).then(res => {
        try {
          if (res && res.status === 200 && new URL(req.url).origin === self.location.origin) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put('./index.html', copy));
          }
        } catch (_) {}
        return res;
      }).catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
    );
    return;
  }
  // cache-first for static assets
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      try {
        if (res && res.status === 200 && new URL(req.url).origin === self.location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
      } catch (_) {}
      return res;
    }).catch(() => hit))
  );
});

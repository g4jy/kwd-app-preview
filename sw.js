// Offline shell + data. Network first for the page, cache first for hashed assets and data.
const V = 'fk-v4';
self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(caches.open(V).then((c) => c.addAll(['/', '/manifest.webmanifest']))); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V && k !== 'fk-data').map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  const isPage = r.mode === 'navigate';
  if (new URL(r.url).pathname.startsWith('/data/')) return;   // study data is cached by the app itself ('fk-data'), with versions
  if (isPage) {
    e.respondWith(fetch(r).then((res) => { const cp = res.clone(); caches.open(V).then((c) => c.put('/', cp)); return res; }).catch(() => caches.match('/')));
    return;
  }
  e.respondWith(caches.match(r).then((hit) => hit || fetch(r).then((res) => {
    if (res.ok) { const cp = res.clone(); caches.open(V).then((c) => c.put(r, cp)); }
    return res;
  })));
});

/* T140j: d/*.json(세트·색인 조각)은 주소에 ?v=<해시>가 붙어 내용이 바뀌면 주소도 바뀐다. 한 번 받은 것은 기기에 두고 두 번째부터 즉시 쓴다.
   같은 파일의 옛 v 는 새 v 를 저장할 때 지운다. 화면(index.html)은 건드리지 않는다 */
const CN = "kwd-d-v1";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin || !/\/d\/[^/]+\.json$/.test(u.pathname) || !u.searchParams.get("v")) return;
  e.respondWith((async () => {
    const c = await caches.open(CN);
    const hit = await c.match(e.request);
    if (hit) return hit;
    const r = await fetch(e.request);
    if (r.ok) {
      const old = (await c.keys()).filter(k => new URL(k.url).pathname === u.pathname);
      await Promise.all(old.map(k => c.delete(k)));
      await c.put(e.request, r.clone());
    }
    return r;
  })());
});

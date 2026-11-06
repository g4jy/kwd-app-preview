/* T140j: d/*.json(세트·색인 조각)은 주소에 ?v=<해시>가 붙어 내용이 바뀌면 주소도 바뀐다. 한 번 받은 것은 기기에 두고 두 번째부터 즉시 쓴다.
   같은 파일의 옛 v 는 새 v 를 저장할 때 지운다. 화면(index.html)은 건드리지 않는다 */
const CN = "kwd-d-v1";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
/* T090e: 화면(index.html)도 두 번째부터 기기에서 즉시 열고(3시간 안), 뒤에서 새로 받아 둔다. 3시간이 지났거나 처음이면 네트워크 */
const HT = "kwd-html-v1", FRESH = 3 * 3600 * 1000;
const pkey = u => new Request(u.origin + u.pathname.replace(/index\.html$/, ""));
const put = async (c, key, r) => c.put(key, new Response(await r.blob(), { headers: { "content-type": "text/html; charset=utf-8", "x-t": String(Date.now()) } }));
self.addEventListener("message", e => {   // 첫 방문: 화면이 첫 화면을 그린 뒤 알려 주면 그때 한 번 저장(첫 화면 받는 동안 대역폭을 안 씀)
  if (e.data !== "cachePage") return;
  e.waitUntil((async () => { const c = await caches.open(HT), key = pkey(new URL(self.registration.scope)); if (await c.match(key)) return; const r = await fetch(self.registration.scope); if (r.ok) await put(c, key, r) })().catch(() => {}));
});
async function page(e, u) {
  const c = await caches.open(HT), key = pkey(u);
  const hit = await c.match(key);
  const net = fetch(e.request).then(async r => {
    if (r.ok) await put(c, key, r.clone());
    return r;
  }).catch(() => null);
  if (hit && Date.now() - (+hit.headers.get("x-t") || 0) < FRESH) { e.waitUntil(net); return hit; }
  return (await net) || hit || Response.error();
}
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.mode === "navigate" && e.request.method === "GET" && u.origin === location.origin && /\/(index\.html)?$/.test(u.pathname)) { e.respondWith(page(e, u)); return; }
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

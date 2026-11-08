/* Barakat Auto — service worker.
 * Задачи: (1) приложение устанавливается на экран телефона; (2) статические файлы сайта открываются мгновенно;
 * (3) без интернета показывается страница «Нет соединения». Страницы объявлений и API НЕ кешируются — данные всегда свежие. */
const VERSION = "v2";
const STATIC = `bk-static-${VERSION}`;
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(STATIC).then((c) => c.addAll([OFFLINE_URL, "/icons/icon-192.png"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("bk-") && k !== STATIC).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin")) return; // никогда не трогаем

  // Хешированные файлы Next.js и значки: «сначала кеш» (имя файла меняется при каждой сборке)
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    e.respondWith(
      caches.open(STATIC).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      }),
    );
    return;
  }

  // Переходы по страницам: сеть; если сети нет — страница «Нет соединения»
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
  }
});

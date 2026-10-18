// Caches the app files so it opens instantly and works offline.
// Bump CACHE when any app file changes, so phones pick up the new version.
const CACHE = "elb-v14";
const FILES = ["./", "index.html", "style.css", "app.js", "data-2025-26.js", "season-2026-27.json", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // This season's results: always try the internet first, fall back to the saved copy when offline.
  if (new URL(e.request.url).pathname.endsWith("/season-2026-27.json")) {
    e.respondWith(fetch(e.request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put("season-2026-27.json", copy)); }
      return res;
    }).catch(() => caches.match("season-2026-27.json")));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request)));
});

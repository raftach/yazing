// Offline support. Scope is the folder this file is served from, so a copy under /yazing/next/
// never controls the app at /yazing/.
const CACHE = 'yazing-v2-1';
const SHELL = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/apple-touch-icon.png',
  './fonts/commissioner-greek.woff2', './fonts/commissioner-latin.woff2',
  './fonts/jetbrainsmono-greek.woff2', './fonts/jetbrainsmono-latin.woff2'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(SHELL);
    // Also cache the hashed JS/CSS bundles referenced by index.html.
    const html = await (await cache.match('./index.html')).text();
    const assets = [...html.matchAll(/(?:src|href)="(\.\/assets\/[^"]+)"/g)].map(m => m[1]);
    await cache.addAll(assets);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('yazing-') && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  // Pages: network first so updates arrive, cached copy when offline.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put('./index.html', res.clone());
        return res;
      } catch {
        return (await caches.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  // Everything else: cache first (bundles are content-hashed), then network.
  event.respondWith((async () => {
    const hit = await caches.match(req);
    if (hit) return hit;
    const res = await fetch(req);
    if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
    return res;
  })());
});

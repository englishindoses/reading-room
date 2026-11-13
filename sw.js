const VERSION = 'reading-room-assets-v2-warm';
const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './assets/icon.svg', './assets/icon-192.png', './assets/icon-512.png',
  './src/app.js', './src/db.js', './src/backup.js', './src/content.js', './src/pages.js', './src/icons.js', './src/i18n.js', './src/styles.css',
  './content/catalogue.json', './content/the-red-bag/book.json', './content/the-red-bag/cover.svg', './content/a-day-at-the-pond/book.json', './content/a-day-at-the-pond/cover.svg'
];
self.addEventListener('install', event => {
  // Activation waits for explicit user action on updates. No user data is touched.
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(ASSETS);
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // Delete only caches owned by this app; IndexedDB is independent.
    for (const key of await caches.keys()) if (key.startsWith('reading-room-assets-') && key !== VERSION) await caches.delete(key);
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'ACTIVATE') self.skipWaiting();
  if (event.data?.type === 'CHECK_CACHE') event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    const present = await Promise.all(ASSETS.map(asset => cache.match(asset)));
    event.ports[0]?.postMessage({ ready: present.every(Boolean) });
  })());
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const cached = await cache.match(event.request);
    if (cached) return cached;
    try { return await fetch(event.request); }
    catch (err) {
      if (event.request.mode === 'navigate') return cache.match('./index.html');
      throw err;
    }
  })());
});

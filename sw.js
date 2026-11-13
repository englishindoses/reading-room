const VERSION = 'reading-room-assets-v4-sam-red-bag';
const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './assets/icon.svg', './assets/icon-192.png', './assets/icon-512.png',
  './src/app.js', './src/db.js', './src/backup.js', './src/content.js', './src/pages.js', './src/icons.js', './src/i18n.js', './src/styles.css', './src/avatars.js',
  './assets/avatars/character-1.webp', './assets/avatars/character-2.webp', './assets/avatars/character-3.webp',
  './assets/avatars/character-4.webp', './assets/avatars/character-5.webp', './assets/avatars/character-6.webp',
  './assets/avatars/character-7.webp', './assets/avatars/character-8.webp', './assets/avatars/character-9.webp',
  './content/catalogue.json',
  './content/sam-and-the-red-bag/book.json',
  './content/sam-and-the-red-bag/front-cover.webp',
  './content/sam-and-the-red-bag/page-01.webp',
  './content/sam-and-the-red-bag/page-02.webp',
  './content/sam-and-the-red-bag/page-03.webp',
  './content/sam-and-the-red-bag/page-04.webp',
  './content/sam-and-the-red-bag/page-05.webp',
  './content/sam-and-the-red-bag/page-06.webp',
  './content/sam-and-the-red-bag/page-07.webp',
  './content/sam-and-the-red-bag/page-08.webp',
  './content/sam-and-the-red-bag/page-09.webp',
  './content/sam-and-the-red-bag/page-10.webp',
  './content/sam-and-the-red-bag/page-11.webp',
  './content/sam-and-the-red-bag/page-12.webp',
  './content/sam-and-the-red-bag/page-13.webp',
  './content/sam-and-the-red-bag/page-14.webp'
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

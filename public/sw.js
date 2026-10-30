// DukanCloude doesn't use a service worker. A browser that still has one registered
// for this origin (e.g. from another app once served on localhost:3000) keeps asking
// for /sw.js — this takes its place, clears its caches and unregisters itself.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
    })(),
  );
});

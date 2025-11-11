const CACHE_NAME = 'sl-pwa-v1'; // ändra version vid varje uppdatering
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js'
];

// Installera och cacha resurser
self.addEventListener('install', event => {
  self.skipWaiting(); // ⚡️ Tvingar ny version att aktiveras direkt
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// Aktivera och rensa gammal cache
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim()) // ⚡️ Tar kontroll över alla flikar
  );
});

// Hämta resurser med stale-while-revalidate
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      });
      return cachedResponse || fetchPromise;
    })
  );
});

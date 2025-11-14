const CACHE_NAME = 'sl-pwa-v1'; // ändra version vid varje uppdatering
const urlsToCache = [
  '/bussar/hallplats.html',
  '/bussar/', // index i mappen om relevant
  '/bussar/favicon.ico' // lägg till fler resurser du vill cacha, t.ex. ikoner eller bilder
];

// Installera och cacha resurser
self.addEventListener('install', event => {
  self.skipWaiting(); // ⚡️ Tvingar ny version att aktiveras direkt (valfritt)
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

// Hantera meddelanden från klienten (t.ex. SKIP_WAITING)
self.addEventListener('message', event => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Hämta resurser med stale-while-revalidate
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        // Spara alltid en kopia i cache för framtida anrop
        return caches.open(CACHE_NAME).then(cache => {
          // Klona eftersom response är en stream
          try {
            cache.put(event.request, networkResponse.clone());
          } catch (err) {
            // Put kan misslyckas för cross-origin requests, ignorerar då
          }
          return networkResponse;
        });
      }).catch(() => {
        // Network-fel -> använd cache om möjligt
        return cachedResponse;
      });

      // Returnera cache om det finns, annars väntar vi på nätverkssvaret
      return cachedResponse || fetchPromise;
    })
  );
});

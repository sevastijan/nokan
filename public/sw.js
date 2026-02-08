const CACHE_VERSION = 'nokan-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const PAGES_CACHE = `${CACHE_VERSION}-pages`;

const OFFLINE_URL = '/offline';

// Precache the offline fallback page during install
self.addEventListener('install', (event) => {
     event.waitUntil(
          caches
               .open(PAGES_CACHE)
               .then((cache) => cache.add(OFFLINE_URL))
               .then(() => self.skipWaiting())
     );
});

// Clean up old caches on activation
self.addEventListener('activate', (event) => {
     event.waitUntil(
          caches
               .keys()
               .then((keys) =>
                    Promise.all(
                         keys
                              .filter((key) => !key.startsWith(CACHE_VERSION))
                              .map((key) => caches.delete(key))
                    )
               )
               .then(() => self.clients.claim())
     );
});

self.addEventListener('fetch', (event) => {
     const { request } = event;
     const url = new URL(request.url);

     // Network-only: API routes and Supabase
     if (
          url.pathname.startsWith('/api/') ||
          url.hostname.includes('supabase')
     ) {
          return;
     }

     // Cache-first: Next.js static assets (content-hashed, immutable)
     if (url.pathname.startsWith('/_next/static/')) {
          event.respondWith(
               caches.match(request).then(
                    (cached) =>
                         cached ||
                         fetch(request).then((response) => {
                              const clone = response.clone();
                              caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
                              return response;
                         })
               )
          );
          return;
     }

     // Cache-first: images and fonts
     if (
          request.destination === 'image' ||
          request.destination === 'font'
     ) {
          event.respondWith(
               caches.match(request).then(
                    (cached) =>
                         cached ||
                         fetch(request).then((response) => {
                              const clone = response.clone();
                              caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
                              return response;
                         })
               )
          );
          return;
     }

     // Network-first: HTML navigations
     if (request.mode === 'navigate') {
          event.respondWith(
               fetch(request)
                    .then((response) => {
                         const clone = response.clone();
                         caches.open(PAGES_CACHE).then((cache) => cache.put(request, clone));
                         return response;
                    })
                    .catch(() =>
                         caches.match(request).then(
                              (cached) => cached || caches.match(OFFLINE_URL)
                         )
                    )
          );
          return;
     }
});

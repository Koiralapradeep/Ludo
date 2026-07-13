const CACHE_NAME = 'puttu-ludo-v25';

const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './game.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon.png',
  './apple-touch-icon.png'
];

const OPTIONAL_ASSETS = [
  './audio.js',
  './favicon.ico'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        [...APP_SHELL, ...OPTIONAL_ASSETS].map(asset => cache.add(asset))
      );
    })
  );

  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName =>
              cacheName.startsWith('puttu-ludo-') &&
              cacheName !== CACHE_NAME
            )
            .map(cacheName => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;

  if (
    request.method !== 'GET' ||
    !request.url.startsWith(self.location.origin)
  ) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME).then(cache => {
              cache.put('./index.html', copy);
            });
          }

          return response;
        })
        .catch(async () => {
          return (
            await caches.match('./index.html') ||
            await caches.match('./')
          );
        })
    );

    return;
  }

  event.respondWith(
    caches.match(request).then(cachedResponse => {
      const networkResponse = fetch(request).then(response => {
        if (response && response.ok) {
          const copy = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, copy);
          });
        }

        return response;
      });

      return cachedResponse || networkResponse;
    }).catch(() => caches.match(request))
  );
});
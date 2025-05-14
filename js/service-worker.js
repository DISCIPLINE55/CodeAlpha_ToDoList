const CACHE_NAME = 'taskmaster-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/script.js',
  '/js/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('✅ Caching app shell...');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting(); // Activate worker immediately
});

// Activate and Clean Old Caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim(); // Claim control immediately
});

// Fetch from Cache or Network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).catch(() => {
        // Fallback for navigation when offline
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        // Optional: fallback image if needed
        if (event.request.destination === 'image') {
          return caches.match('/icons/icon-192.png');
        }
      });
    })
  );
});

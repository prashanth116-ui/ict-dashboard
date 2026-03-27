// ICT Mastery Dashboard — Service Worker
// Cache-first strategy for offline use

const CACHE_NAME = 'ict-mastery-v1';
const ASSETS = [
  '/',
  '/index.html',
  'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap'
];

// Install: cache all assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first, network fallback
self.addEventListener('fetch', event => {
  // Skip non-GET and cross-origin API calls (Yahoo Finance ticker)
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('yahoo') || event.request.url.includes('query1.finance')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache successful responses for our domain
        if (response.ok && event.request.url.startsWith(self.location.origin)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback: serve index.html for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

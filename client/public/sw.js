/**
 * sw.js - CampusNode Service Worker
 * Enables offline capability and serves cached index.html when user opens website without internet connection.
 */

const CACHE_NAME = 'campusnode-offline-v1';

// Assets to precache on installation
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/darkthemelogo.png',
  '/lightthemelogo2.png',
  '/clubsetu-favicon.jpg',
  '/favicon.ico',
];

// Install Event - Precache critical shell files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Precaching app shell');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[Service Worker] Precache partial error:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up stale caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Intercept network requests for offline fallback
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip non-http(s) and third-party API/socket requests if needed
  if (url.origin !== self.location.origin) {
    return;
  }

  // Handle HTML navigation requests (Page visits)
  const isNavigation =
    event.request.mode === 'navigate' ||
    (event.request.headers.get('accept') &&
      event.request.headers.get('accept').includes('text/html'));

  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If online and response valid, clone and cache latest page
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
              cache.put('/index.html', response.clone());
            });
          }
          return response;
        })
        .catch(async () => {
          console.log('[Service Worker] Offline navigation detected. Returning cached index.html');
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback to index.html for Single Page App client-side routing
          const fallback = await cache.match('/index.html');
          if (fallback) {
            return fallback;
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        })
    );
    return;
  }

  // Handle static assets (JS, CSS, Images, Fonts) - Network First with Cache Fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedAsset = await cache.match(event.request);
        if (cachedAsset) {
          return cachedAsset;
        }
        return new Response('', { status: 404, statusText: 'Not Found Offline' });
      })
  );
});

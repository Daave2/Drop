/**
 * NoteDrop Service Worker
 *
 * This service worker handles caching for offline functionality and background
 * push notifications. It uses a cache-first strategy for static assets and
 * map tiles, and a network-first strategy for dynamic API data.
 */

// Bump this version to force an update of the service worker and its caches.
const CACHE_VERSION = 2;
const STATIC_CACHE_NAME = `notedrop-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `notedrop-dynamic-v${CACHE_VERSION}`;
const ALL_CACHES = [STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME];

// Firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');
importScripts('/firebase-config.js');

if (self.firebaseConfig) {
  firebase.initializeApp(self.firebaseConfig);
  firebase.messaging();
}

/**
 * On install, immediately activate the new service worker.
 */
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

/**
 * On activation, claim all clients and clean up old caches.
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Remove old caches that don't match the current version.
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => !ALL_CACHES.includes(name))
          .map((name) => caches.delete(name))
      );
      // Take control of all open clients immediately.
      await self.clients.claim();
    })()
  );
});

/**
 * Intercept fetch requests to apply caching strategies.
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Use a cache-first strategy for map tiles because they rarely change.
  if (url.hostname.includes('tile.openstreetmap.org') || url.hostname.includes('cartocdn.com')) {
    event.respondWith(cacheFirst(request));
  }
  // Use a network-first strategy for dynamic API data to ensure freshness.
  else if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
  }
  // Use a cache-first strategy for other same-origin requests (app shell).
  else if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request));
  }
  // For all other requests, just fetch from the network.
  else {
    event.respondWith(fetch(request));
  }
});

/**
 * Cache-First Strategy:
 * 1. Try to get the response from the cache.
 * 2. If it's in the cache, return it.
 * 3. If not, fetch from the network, cache the response, and then return it.
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  try {
    const response = await fetch(request);
    // For non-essential assets, we don't block on caching.
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // If the network fails and it's not in the cache, it's just a failed request.
    console.error('Fetch failed:', error);
    throw error;
  }
}

/**
 * Network-First Strategy:
 * 1. Try to fetch the resource from the network.
 * 2. If successful, cache the new response and return it.
 * 3. If the network fails, fall back to the cached version.
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Network failed, try the cache.
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    // If it's not in the cache either, the request fails.
    console.error('Network and cache failed:', error);
    throw error;
  }
}

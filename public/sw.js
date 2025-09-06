/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
importScripts(
  'https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js'
);
importScripts(
  'https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js'
);
importScripts('/firebase-config.js');

const CACHE_VERSION = 'v1';
const STATIC_CACHE_NAME = `notedrop-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `notedrop-dynamic-${CACHE_VERSION}`;
const ALL_CACHES = [STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME];

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-512.png',
  '/favicon.svg',
];

if (self.firebaseConfig) {
  firebase.initializeApp(self.firebaseConfig);
  if (firebase.messaging.isSupported()) {
    const messaging = firebase.messaging();
    messaging.onBackgroundMessage(function (payload) {
      console.log(
        '[firebase-messaging-sw.js] Received background message ',
        payload
      );
      const notificationTitle = payload.notification.title;
      const notificationOptions = {
        body: payload.notification.body,
        icon: '/icon-192.png',
      };
      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (!ALL_CACHES.includes(key)) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Cache-first for map tiles
  if (url.hostname.endsWith('tile.openstreetmap.org')) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        const networkResponse = await fetch(event.request);
        cache.put(event.request, networkResponse.clone());
        return networkResponse;
      })
    );
    return;
  }

  // Network-first for API calls (notes)
  if (url.pathname.includes('/api/notes')) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE_NAME).then(async (cache) => {
        try {
          const networkResponse = await fetch(event.request);
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        } catch (e) {
          const cachedResponse = await cache.match(event.request);
          return cachedResponse;
        }
      })
    );
    return;
  }

  // Fallback to cache-first for other requests
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

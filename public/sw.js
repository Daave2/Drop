
// A service worker is required for background notifications.
// See https://firebase.google.com/docs/cloud-messaging/js/client
'use client';
importScripts(
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js'
);
importScripts(
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js'
);
importScripts('/firebase-config.js');

const app = firebase.initializeApp(self.firebaseConfig);
const messaging = firebase.messaging(app);

messaging.onBackgroundMessage((payload) => {
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

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.hostname === 'tile.openstreetmap.org') {
    event.respondWith(
      caches.open('tiles').then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        const res = await fetch(event.request);
        cache.put(event.request, res.clone());
        return res;
      })
    );
    return;
  }

  if (url.pathname.startsWith('/api/notes')) {
    event.respondWith(
      caches.open('api').then(async (cache) => {
        try {
          const res = await fetch(event.request);
          cache.put(event.request, res.clone());
          return res;
        } catch {
          const cached = await cache.match(event.request);
          return cached || new Response('', { status: 500 });
        }
      })
    );
  }
});

importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-messaging-compat.js');
importScripts('/firebase-config.js');

firebase.initializeApp(self.firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title ?? 'Notification';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/icon-192.png',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyB-TzOLPxOObBJ9tRtNsCo8Dw_ppcNoTyw",
  authDomain: "travhub-9b75b.firebaseapp.com",
  projectId: "travhub-9b75b",
  storageBucket: "travhub-9b75b.firebasestorage.app",
  messagingSenderId: "377945042573",
  appId: "1:377945042573:web:e139b306f7b109c1bcbcc4",
  measurementId: "G-745BMD38HH"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // The FCM SDK automatically displays a notification if the payload contains a 'notification' object.
  // We do not need to call self.registration.showNotification manually here, as it causes duplicates.
});

// A fetch listener is strictly required by Android Chrome to recognize the site as a valid PWA.
// Without this, Android refuses to install it as a standalone app and forces the address bar to show.
self.addEventListener('fetch', function(event) {
  // We can just let the browser handle the fetch normally
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  // Extract chatId if it was passed from backend
  const chatId = event.notification.data?.FCM_MSG?.data?.chatId || event.notification.data?.chatId;
  const targetUrl = event.notification.data?.FCM_MSG?.data?.url || event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) { client = clientList[i]; break; }
        }
        if (chatId) {
          client.postMessage({ type: 'OPEN_CHAT', chatId: chatId });
        }
        return client.focus();
      }
      return clients.openWindow(targetUrl);
    })
  );
});

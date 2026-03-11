importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyALm3KX9GBmrhTjLiUTd_NV3OFVIW8cjJ4",
  authDomain: "srutidrsya.firebaseapp.com",
  projectId: "srutidrsya",
  storageBucket: "srutidrsya.firebasestorage.app",
  messagingSenderId: "645482388272",
  appId: "1:645482388272:web:5bed824d8a89f0d0d506f5",
  measurementId: "G-27NRYLWSXQ"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

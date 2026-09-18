/* eslint-disable no-undef */
// Firebase config here is duplicated from NEXT_PUBLIC_FIREBASE_* env vars because
// service workers are static files and cannot read process.env at request time.
// Update these by hand whenever the Firebase project's web config changes.
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDH69aw5yS-0EcBrWDZzz9uY4u6moCEiCk",
  authDomain: "bekur-sales-call-tracking.firebaseapp.com",
  projectId: "bekur-sales-call-tracking",
  storageBucket: "bekur-sales-call-tracking.firebasestorage.app",
  messagingSenderId: "218360794690",
  appId: "1:218360794690:web:655dc28d420feb46fba7db",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? "Bekur";
  const body = payload.notification?.body ?? "";
  const link = payload.fcmOptions?.link ?? payload.data?.url ?? "/";

  self.registration.showNotification(title, {
    body,
    icon: "/bekur-logo.svg",
    data: { link },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification.data?.link ?? "/";
  event.waitUntil(clients.openWindow(link));
});

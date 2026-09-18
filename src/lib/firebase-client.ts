"use client";

import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseApp() {
  const existing = getApps();
  return existing.length ? existing[0] : initializeApp(firebaseConfig);
}

async function acquireToken(): Promise<string | null> {
  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  await navigator.serviceWorker.ready;
  const messaging = getMessaging(getFirebaseApp());
  return getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });
}

export async function requestNotificationPermissionAndToken(): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return { ok: false, error: "This browser doesn't support notifications." };
  }

  const supported = await isSupported().catch(() => false);
  if (!supported) return { ok: false, error: "This browser doesn't support push notifications." };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, error: "Notification permission was not granted." };

  try {
    const token = await acquireToken();
    if (!token) return { ok: false, error: "Could not get a push token from Firebase." };
    return { ok: true, token };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not register for push notifications." };
  }
}

/**
 * Returns this browser's existing push token without prompting for permission.
 * Used to (a) silently re-bind an already-granted browser to whoever is
 * currently signed in, so a shared/kiosk device can't keep pushing to the
 * previous user, and (b) look up the token to unregister on sign-out.
 */
export async function getExistingPushToken(): Promise<string | null> {
  if (typeof window === "undefined" || !("Notification" in window)) return null;
  if (Notification.permission !== "granted") return null;

  const supported = await isSupported().catch(() => false);
  if (!supported) return null;

  try {
    return await acquireToken();
  } catch {
    return null;
  }
}

export async function listenForForegroundMessages(onNotification: (title: string, body: string, link: string) => void) {
  const supported = await isSupported().catch(() => false);
  if (!supported) return () => {};

  const messaging = getMessaging(getFirebaseApp());
  return onMessage(messaging, (payload) => {
    const title = payload.notification?.title ?? "Bekur";
    const body = payload.notification?.body ?? "";
    const link = payload.fcmOptions?.link ?? (payload.data?.url as string | undefined) ?? "/";
    onNotification(title, body, link);

    if (Notification.permission === "granted") {
      new Notification(title, { body, icon: "/bekur-logo.svg" }).onclick = () => window.open(link, "_self");
    }
  });
}

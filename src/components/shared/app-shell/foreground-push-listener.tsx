"use client";

import { useEffect } from "react";
import { getExistingPushToken, listenForForegroundMessages } from "@/lib/firebase-client";
import { registerDeviceTokenAction } from "@/actions/notifications";

export function ForegroundPushListener() {
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    listenForForegroundMessages((title, body) => {
      console.info(`[push] ${title}: ${body}`);
    }).then((unsub) => {
      if (cancelled) unsub();
      else unsubscribe = unsub;
    });

    // If this browser already has push enabled, silently re-bind its token to
    // whoever is signed in right now. Without this, a shared device where
    // Sales Rep A enabled push and later Sales Rep B signs in (without
    // re-clicking "Enable") would keep delivering A's notifications to B.
    getExistingPushToken().then((token) => {
      if (token && !cancelled) registerDeviceTokenAction({ token, userAgent: navigator.userAgent });
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  return null;
}

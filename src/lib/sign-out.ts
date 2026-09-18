"use client";

import { signOut } from "next-auth/react";
import { getExistingPushToken } from "@/lib/firebase-client";
import { unregisterDeviceTokenAction } from "@/actions/notifications";

/**
 * Signs the current user out, first unregistering this browser's push token
 * (if any) from their account. Without this, a shared device would keep
 * delivering the previous user's push notifications to whoever signs in next.
 */
export async function signOutWithPushCleanup(options?: Parameters<typeof signOut>[0]) {
  try {
    const token = await getExistingPushToken();
    if (token) await unregisterDeviceTokenAction({ token });
  } catch {
    // Best-effort cleanup — never block sign-out on this.
  }

  return signOut(options);
}

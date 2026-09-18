"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission, requireUser } from "@/lib/require-user";
import { registerDeviceToken, unregisterDeviceToken, updateNotificationPreference } from "@/services/notifications.service";

const registerDeviceTokenSchema = z.object({ token: z.string().min(1), userAgent: z.string().optional() });

export async function registerDeviceTokenAction(input: z.infer<typeof registerDeviceTokenSchema>) {
  const parsed = registerDeviceTokenSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid device token." };

  const user = await requirePermission("notifications:manage_own");
  await registerDeviceToken(user.id, parsed.data.token, parsed.data.userAgent ?? null);
  return { ok: true as const };
}

const unregisterDeviceTokenSchema = z.object({ token: z.string().min(1) });

export async function unregisterDeviceTokenAction(input: z.infer<typeof unregisterDeviceTokenSchema>) {
  const parsed = unregisterDeviceTokenSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const };

  const user = await requireUser();
  await unregisterDeviceToken(user.id, parsed.data.token);
  return { ok: true as const };
}

const updatePreferenceSchema = z.object({ categoryId: z.string().min(1), channelPush: z.boolean(), channelEmail: z.boolean() });

export async function updateNotificationPreferenceAction(input: z.infer<typeof updatePreferenceSchema>) {
  const parsed = updatePreferenceSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid preference." };

  const user = await requirePermission("notifications:manage_own");
  await updateNotificationPreference(user.id, parsed.data.categoryId, { channelPush: parsed.data.channelPush, channelEmail: parsed.data.channelEmail });
  revalidatePath("/settings");
  return { ok: true as const };
}

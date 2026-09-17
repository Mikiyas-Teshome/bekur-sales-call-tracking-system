"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/require-user";
import { changePassword, updateProfile } from "@/services/profile.service";

const updateProfileSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your name."),
  email: z.email("Enter a valid email."),
  phone: z.string().trim().optional(),
});

export async function updateProfileAction(input: z.infer<typeof updateProfileSchema>) {
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid profile." };

  const user = await requirePermission("profile:edit_own");
  try {
    const updated = await updateProfile(user.id, { fullName: parsed.data.fullName, email: parsed.data.email, phone: parsed.data.phone || null });
    revalidatePath("/settings");
    return { ok: true as const, fullName: updated.fullName, email: updated.email };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Could not update profile." };
  }
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password."),
  newPassword: z.string().min(8, "New password must be at least 8 characters."),
});

export async function changePasswordAction(input: z.infer<typeof changePasswordSchema>) {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid password." };

  const user = await requirePermission("security:change_password_own");
  try {
    await changePassword(user.id, parsed.data);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Could not update password." };
  }
}

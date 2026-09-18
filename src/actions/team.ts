"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/require-user";
import { inviteTeamMember, resolveUserId, setTeamMemberActive } from "@/services/team.service";
import { listAssignedLeadsForUser } from "@/services/clients.service";

const inviteSchema = z.object({
  fullName: z.string().trim().min(1, "Enter a name."),
  email: z.email("Enter a valid email."),
  roleCode: z.string().min(1),
});

export async function inviteTeamMemberAction(input: z.infer<typeof inviteSchema>) {
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid invitation." };

  const currentUser = await requirePermission("team:invite");
  let result;
  try {
    result = await inviteTeamMember({ ...parsed.data, invitedByName: currentUser.name });
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Could not create the invitation." };
  }

  revalidatePath("/team");
  if (!result.emailSent) return { ok: true as const, emailSent: false as const, emailError: result.emailError };
  return { ok: true as const, emailSent: true as const };
}

export async function getMemberAssignedLeadsAction(memberCode: string) {
  await requirePermission("team:manage_assignments");
  const userId = await resolveUserId(memberCode);
  if (!userId) return { ok: false as const, error: "Teammate not found." };

  const leads = await listAssignedLeadsForUser(userId);
  return { ok: true as const, leads };
}

const setActiveSchema = z.object({ userCode: z.string().min(1), active: z.boolean() });

export async function setTeamMemberActiveAction(input: z.infer<typeof setActiveSchema>) {
  const parsed = setActiveSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid request." };

  const currentUser = await requirePermission("team:deactivate_member");
  const userId = await resolveUserId(parsed.data.userCode);
  if (!userId) return { ok: false as const, error: "Teammate not found." };
  if (userId === currentUser.id && !parsed.data.active) return { ok: false as const, error: "You can't deactivate your own account." };

  try {
    await setTeamMemberActive(userId, parsed.data.active);
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Could not update this teammate." };
  }

  revalidatePath("/team");
  return { ok: true as const };
}

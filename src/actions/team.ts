"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/require-user";
import { inviteTeamMember, resolveUserId } from "@/services/team.service";
import { listAssignedLeadsForUser } from "@/services/clients.service";

const inviteSchema = z.object({
  fullName: z.string().trim().min(1, "Enter a name."),
  email: z.email("Enter a valid email."),
  roleCode: z.string().min(1),
});

export async function inviteTeamMemberAction(input: z.infer<typeof inviteSchema>) {
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid invitation." };

  await requirePermission("team:invite");
  try {
    await inviteTeamMember(parsed.data);
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Could not send invitation." };
  }

  revalidatePath("/team");
  return { ok: true as const };
}

export async function getMemberAssignedLeadsAction(memberCode: string) {
  await requirePermission("team:manage_assignments");
  const userId = await resolveUserId(memberCode);
  if (!userId) return { ok: false as const, error: "Teammate not found." };

  const leads = await listAssignedLeadsForUser(userId);
  return { ok: true as const, leads };
}

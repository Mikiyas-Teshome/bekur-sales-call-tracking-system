"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/require-user";
import { hasPermission, type PermissionSet } from "@/lib/permissions";
import { extractPhoneNumbers } from "@/lib/phone";
import { bulkImportClients, createClient, reassignClients, updateClient } from "@/services/clients.service";
import { resolveUserId } from "@/services/team.service";
import { resolveCampaignId } from "@/services/campaigns.service";

const createClientSchema = z.object({
  displayName: z.string().trim().min(1, "Enter a name."),
  phone: z.string().trim().min(7, "Enter a valid phone number."),
  businessName: z.string().trim().optional(),
  campaignCode: z.string().min(1),
  assigneeCode: z.string().optional(),
});

async function resolveAssignee(assigneeCode: string | undefined, permissions: PermissionSet): Promise<{ assignedUserId: number | null; error?: never } | { error: string; assignedUserId?: never }> {
  if (!assigneeCode) return { assignedUserId: null };
  if (!hasPermission(permissions, "leads:reassign")) return { error: "You can't assign leads to teammates." };
  const assignedUserId = await resolveUserId(assigneeCode);
  if (!assignedUserId) return { error: "Teammate not found." };
  return { assignedUserId };
}

export async function createClientAction(input: z.infer<typeof createClientSchema>) {
  const parsed = createClientSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid lead." };

  const user = await requirePermission("leads:create");
  const campaignId = await resolveCampaignId(parsed.data.campaignCode);
  if (!campaignId) return { ok: false as const, error: "Campaign not found." };
  const assignee = await resolveAssignee(parsed.data.assigneeCode, user.permissions);
  if (assignee.error) return { ok: false as const, error: assignee.error };

  try {
    await createClient({ displayName: parsed.data.displayName, phone: parsed.data.phone, businessName: parsed.data.businessName, campaignId, assignedUserId: assignee.assignedUserId, assignedByUserId: user.id });
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Could not create lead." };
  }

  revalidatePath("/leads");
  return { ok: true as const };
}

const updateClientSchema = z.object({
  clientCode: z.string().min(1),
  displayName: z.string().trim().min(1, "Enter a name."),
  phone: z.string().trim().min(7, "Enter a valid phone number."),
  businessName: z.string().trim().optional(),
});

export async function updateClientAction(input: z.infer<typeof updateClientSchema>) {
  const parsed = updateClientSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid lead." };

  await requirePermission("leads:create");
  try {
    await updateClient(parsed.data.clientCode, { displayName: parsed.data.displayName, phone: parsed.data.phone, businessName: parsed.data.businessName ?? null });
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Could not update lead." };
  }

  revalidatePath("/leads");
  revalidatePath(`/leads/${parsed.data.clientCode}`);
  return { ok: true as const };
}

const bulkImportSchema = z.object({
  text: z.string().trim().min(1, "Paste at least one phone number."),
  campaignCode: z.string().min(1),
  assigneeCode: z.string().optional(),
});

export async function bulkImportAction(input: z.infer<typeof bulkImportSchema>) {
  const parsed = bulkImportSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid import." };

  const user = await requirePermission("leads:import");
  const phones = extractPhoneNumbers(parsed.data.text);
  if (phones.length === 0) return { ok: false as const, error: "No valid phone numbers found." };

  const campaignId = await resolveCampaignId(parsed.data.campaignCode);
  if (!campaignId) return { ok: false as const, error: "Campaign not found." };
  const assignee = await resolveAssignee(parsed.data.assigneeCode, user.permissions);
  if (assignee.error) return { ok: false as const, error: assignee.error };

  const result = await bulkImportClients({ phones, campaignId, assignedUserId: assignee.assignedUserId, assignedByUserId: user.id });
  revalidatePath("/leads");
  return { ok: true as const, ...result };
}

const reassignSchema = z.object({
  clientCodes: z.array(z.string()).min(1, "Select at least one lead."),
  toUserCode: z.string().min(1),
});

export async function reassignClientsAction(input: z.infer<typeof reassignSchema>) {
  const parsed = reassignSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid reassignment." };

  const user = await requirePermission("leads:reassign");
  const toUserId = await resolveUserId(parsed.data.toUserCode);
  if (!toUserId) return { ok: false as const, error: "Teammate not found." };

  const count = await reassignClients({ clientCodes: parsed.data.clientCodes, toUserId, assignedByUserId: user.id });

  revalidatePath("/leads");
  return { ok: true as const, count };
}

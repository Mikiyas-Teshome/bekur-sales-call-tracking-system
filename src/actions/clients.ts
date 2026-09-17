"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/require-user";
import { extractPhoneNumbers } from "@/lib/phone";
import { bulkImportClients, createClient, reassignClients } from "@/services/clients.service";
import { resolveUserId } from "@/services/team.service";
import { resolveCampaignId } from "@/services/campaigns.service";

const createClientSchema = z.object({
  displayName: z.string().trim().min(1, "Enter a name."),
  phone: z.string().trim().min(7, "Enter a valid phone number."),
  businessName: z.string().trim().optional(),
  campaignCode: z.string().min(1),
});

export async function createClientAction(input: z.infer<typeof createClientSchema>) {
  const parsed = createClientSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid lead." };

  await requirePermission("leads:create");
  const campaignId = await resolveCampaignId(parsed.data.campaignCode);
  if (!campaignId) return { ok: false as const, error: "Campaign not found." };

  try {
    await createClient({ displayName: parsed.data.displayName, phone: parsed.data.phone, businessName: parsed.data.businessName, campaignId });
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Could not create lead." };
  }

  revalidatePath("/leads");
  return { ok: true as const };
}

const bulkImportSchema = z.object({
  text: z.string().trim().min(1, "Paste at least one phone number."),
  campaignCode: z.string().min(1),
});

export async function bulkImportAction(input: z.infer<typeof bulkImportSchema>) {
  const parsed = bulkImportSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid import." };

  await requirePermission("leads:import");
  const phones = extractPhoneNumbers(parsed.data.text);
  if (phones.length === 0) return { ok: false as const, error: "No valid phone numbers found." };

  const campaignId = await resolveCampaignId(parsed.data.campaignCode);
  if (!campaignId) return { ok: false as const, error: "Campaign not found." };

  const result = await bulkImportClients({ phones, campaignId });
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

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CampaignPlatform, CampaignStatus } from "@/entities";
import { requirePermission } from "@/lib/require-user";
import { createCampaign, setCampaignStatus } from "@/services/campaigns.service";
import { resolveProjectId } from "@/services/projects.service";

const createCampaignSchema = z.object({
  name: z.string().trim().min(1, "Enter a campaign name."),
  projectCode: z.string().min(1),
  platform: z.enum(CampaignPlatform),
  adSpend: z.number().nonnegative("Spend can't be negative."),
});

export async function createCampaignAction(input: z.infer<typeof createCampaignSchema>) {
  const parsed = createCampaignSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid campaign." };

  await requirePermission("campaigns:create");
  const projectId = await resolveProjectId(parsed.data.projectCode);
  if (!projectId) return { ok: false as const, error: "Project not found." };

  await createCampaign({ name: parsed.data.name, projectId, platform: parsed.data.platform, adSpend: parsed.data.adSpend });

  revalidatePath("/campaigns");
  return { ok: true as const };
}

export async function setCampaignStatusAction(code: string, status: CampaignStatus) {
  await requirePermission("campaigns:manage_status");
  await setCampaignStatus(code, status);
  revalidatePath("/campaigns");
  return { ok: true as const };
}

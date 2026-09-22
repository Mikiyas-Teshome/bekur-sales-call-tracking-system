"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/require-user";
import { isMonthKey } from "@/lib/report-periods";
import { getKpiTargetForUser, saveKpiTarget } from "@/services/kpi.service";
import { resolveUserId } from "@/services/team.service";

const targetValue = z.number().min(0).max(1_000_000_000);

const saveTargetsSchema = z.object({
  userCode: z.string().min(1),
  period: z.string().refine(isMonthKey, "Pick a month."),
  values: z.object({ calls: targetValue, contacts: targetValue, demos: targetValue, dealsWon: targetValue, revenue: targetValue }),
});

export async function saveKpiTargetsAction(input: z.infer<typeof saveTargetsSchema>) {
  const parsed = saveTargetsSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid targets." };

  const currentUser = await requirePermission("kpi:manage_targets");
  const userId = await resolveUserId(parsed.data.userCode);
  if (!userId) return { ok: false as const, error: "Teammate not found." };

  await saveKpiTarget({ userId, period: parsed.data.period, values: parsed.data.values, setByUserId: currentUser.id });

  revalidatePath("/reports");
  revalidatePath("/team");
  return { ok: true as const };
}

const getTargetsSchema = z.object({ userCode: z.string().min(1), period: z.string().refine(isMonthKey, "Pick a month.") });

export async function getKpiTargetsAction(input: z.infer<typeof getTargetsSchema>) {
  const parsed = getTargetsSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid request." };

  await requirePermission("kpi:manage_targets");
  const userId = await resolveUserId(parsed.data.userCode);
  if (!userId) return { ok: false as const, error: "Teammate not found." };

  const target = await getKpiTargetForUser(userId, parsed.data.period);
  return { ok: true as const, values: target.values, exists: target.exists };
}

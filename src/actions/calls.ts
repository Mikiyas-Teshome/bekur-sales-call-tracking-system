"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CallOutcome, PipelineStage } from "@/entities";
import { requirePermission } from "@/lib/require-user";
import { logCall as logCallService } from "@/services/calls.service";
import { resolveClientId } from "@/services/clients.service";

const logCallSchema = z.object({
  clientCode: z.string().min(1),
  outcome: z.enum(CallOutcome),
  outcomeNote: z.string().trim().min(1, "Add a note about what happened on the call."),
  pipelineStageAfter: z.enum(PipelineStage),
  dealValue: z.string().optional(),
  nextFollowUpDate: z.string().optional(),
  calledAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)).optional(),
});

export async function logCallAction(input: z.infer<typeof logCallSchema>) {
  const parsed = logCallSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid call." };

  const user = await requirePermission("calls:log");
  const clientId = await resolveClientId(parsed.data.clientCode);
  if (!clientId) return { ok: false as const, error: "Lead not found." };

  await logCallService({
    clientId,
    loggedByUserId: user.id,
    outcome: parsed.data.outcome,
    outcomeNote: parsed.data.outcomeNote,
    pipelineStageAfter: parsed.data.pipelineStageAfter,
    dealValue: parsed.data.dealValue || null,
    nextFollowUpDate: parsed.data.nextFollowUpDate || null,
    calledAt: parsed.data.calledAt ?? undefined,
  });

  revalidatePath("/");
  revalidatePath("/leads");
  return { ok: true as const };
}

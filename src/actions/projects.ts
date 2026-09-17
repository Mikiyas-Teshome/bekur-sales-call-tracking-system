"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/require-user";
import { archiveProject, createProject } from "@/services/projects.service";

const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Enter a project name."),
  description: z.string().trim().optional(),
  ownerName: z.string().trim().min(1, "Choose an owner."),
  revenueTarget: z.number().nonnegative("Target can't be negative."),
});

export async function createProjectAction(input: z.infer<typeof createProjectSchema>) {
  const parsed = createProjectSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid project." };

  await requirePermission("projects:create");
  await createProject({ ...parsed.data, description: parsed.data.description ?? "" });

  revalidatePath("/projects");
  return { ok: true as const };
}

export async function archiveProjectAction(code: string) {
  await requirePermission("projects:archive");
  await archiveProject(code);
  revalidatePath("/projects");
  return { ok: true as const };
}

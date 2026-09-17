"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/require-user";
import { permissionCatalog, type PermissionKey } from "@/lib/permissions";
import { assignUserRole, createRole, deleteRole, renameRole, resolveRoleId, updateRolePermissions } from "@/services/roles.service";
import { resolveUserId } from "@/services/team.service";

const permissionKeySchema = z.enum(permissionCatalog.map((permission) => permission.key) as [PermissionKey, ...PermissionKey[]]);

const createRoleSchema = z.object({
  name: z.string().trim().min(1, "Enter a role name."),
  description: z.string().trim().optional(),
  permissionKeys: z.array(permissionKeySchema),
});

export async function createRoleAction(input: z.infer<typeof createRoleSchema>) {
  const parsed = createRoleSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid role." };

  await requirePermission("roles:manage");
  try {
    await createRole(parsed.data);
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Could not create role." };
  }

  revalidatePath("/team/roles");
  return { ok: true as const };
}

const renameRoleSchema = z.object({ roleId: z.number(), name: z.string().trim().min(1, "Enter a role name.") });

export async function renameRoleAction(input: z.infer<typeof renameRoleSchema>) {
  const parsed = renameRoleSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid role." };

  await requirePermission("roles:manage");
  try {
    await renameRole(parsed.data.roleId, parsed.data.name);
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Could not rename role." };
  }

  revalidatePath("/team/roles");
  return { ok: true as const };
}

const updateRolePermissionsSchema = z.object({ roleId: z.number(), permissionKeys: z.array(permissionKeySchema) });

export async function updateRolePermissionsAction(input: z.infer<typeof updateRolePermissionsSchema>) {
  const parsed = updateRolePermissionsSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid permissions." };

  await requirePermission("roles:manage");
  try {
    await updateRolePermissions(parsed.data.roleId, parsed.data.permissionKeys);
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Could not update permissions." };
  }

  revalidatePath("/team/roles");
  return { ok: true as const };
}

export async function deleteRoleAction(roleId: number) {
  await requirePermission("roles:manage");
  try {
    await deleteRole(roleId);
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Could not delete role." };
  }

  revalidatePath("/team/roles");
  return { ok: true as const };
}

const assignUserRoleSchema = z.object({ userCode: z.string().min(1), roleCode: z.string().min(1) });

export async function assignUserRoleAction(input: z.infer<typeof assignUserRoleSchema>) {
  const parsed = assignUserRoleSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid role change." };

  await requirePermission("team:assign_role");
  const userId = await resolveUserId(parsed.data.userCode);
  const roleId = await resolveRoleId(parsed.data.roleCode);
  if (!userId) return { ok: false as const, error: "Teammate not found." };
  if (!roleId) return { ok: false as const, error: "Role not found." };

  try {
    await assignUserRole(userId, roleId);
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Could not change role." };
  }

  revalidatePath("/team");
  return { ok: true as const };
}

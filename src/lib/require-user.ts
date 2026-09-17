import "server-only";
import { auth } from "@/auth";
import { hasPermission, type PermissionKey, type PermissionSet } from "@/lib/permissions";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  return {
    id: Number(session.user.id),
    roleId: session.user.roleId,
    roleCode: session.user.roleCode,
    roleName: session.user.roleName,
    permissions: session.user.permissions as PermissionSet,
    name: session.user.name,
    email: session.user.email,
  };
}

export async function requirePermission(key: PermissionKey) {
  const user = await requireUser();
  if (!hasPermission(user.permissions, key)) throw new Error("Not authorized");
  return user;
}

import { RoleGate } from "@/components/shared/role-gate";
import { RolesWorkspace } from "@/features/team/roles-workspace";
import { listRoles, listPermissionCatalog } from "@/services/roles.service";

export const dynamic = "force-dynamic";

export default async function TeamRolesPage() {
  const roles = await listRoles();
  const permissions = listPermissionCatalog();

  return (
    <RoleGate permission="roles:manage">
      <RolesWorkspace initialRoles={roles} permissions={permissions} />
    </RoleGate>
  );
}

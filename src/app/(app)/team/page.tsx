import { RoleGate } from "@/components/shared/role-gate";
import { TeamWorkspace } from "@/features/team/team-workspace";
import { listTeamMembers } from "@/services/team.service";
import { listRoles } from "@/services/roles.service";

export default async function TeamPage() {
  const [members, roles] = await Promise.all([listTeamMembers(), listRoles()]);

  return (
    <RoleGate permission="team:view">
      <TeamWorkspace initialMembers={members.map((member) => ({ ...member, projects: 0 }))} roles={roles.map((role) => ({ code: role.code, name: role.name }))} />
    </RoleGate>
  );
}

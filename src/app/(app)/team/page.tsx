import { RoleGate } from "@/components/shared/role-gate";
import { TeamWorkspace } from "@/features/team/team-workspace";
import { getTeamSummary, listTeamMembers, listTeamMembersPage } from "@/services/team.service";
import { listRoles } from "@/services/roles.service";
import { DEFAULT_PAGE_SIZE, parsePage, parseParam } from "@/lib/pagination";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function TeamPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const search = parseParam(params.search, "");
  const role = parseParam(params.role, "All roles");
  const status = parseParam(params.status, "All statuses");

  const [result, allMembers, roles, summary] = await Promise.all([
    listTeamMembersPage({ page, pageSize: DEFAULT_PAGE_SIZE, search: search || undefined, role, status }),
    listTeamMembers(),
    listRoles(),
    getTeamSummary(),
  ]);

  return (
    <RoleGate permission="team:view">
      <TeamWorkspace
        result={{ ...result, items: result.items.map((member) => ({ ...member, projects: 0 })) }}
        allMembers={allMembers.map((member) => ({ ...member, projects: 0 }))}
        roles={roles.map((role) => ({ code: role.code, name: role.name }))}
        summary={summary}
        filters={{ search, role, status }}
      />
    </RoleGate>
  );
}

import { RoleGate } from "@/components/shared/role-gate";
import { ProjectsWorkspace } from "@/features/projects/components/projects-workspace";
import { getProjectsSummary, listProjectsPage } from "@/services/projects.service";
import { listTeamMembers } from "@/services/team.service";
import { DEFAULT_PAGE_SIZE, parsePage, parseParam } from "@/lib/pagination";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ProjectsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const search = parseParam(params.search, "");
  const status = parseParam(params.status, "All statuses");

  const [result, team, summary] = await Promise.all([listProjectsPage({ page, pageSize: DEFAULT_PAGE_SIZE, search: search || undefined, status }), listTeamMembers(), getProjectsSummary()]);
  const owners = team.map((member) => member.name);

  return (
    <RoleGate permission="projects:view">
      <ProjectsWorkspace result={result} owners={owners} summary={summary} filters={{ search, status }} />
    </RoleGate>
  );
}

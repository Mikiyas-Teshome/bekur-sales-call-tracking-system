import { RoleGate } from "@/components/shared/role-gate";
import { ProjectsWorkspace } from "@/features/projects/components/projects-workspace";
import { listProjects } from "@/services/projects.service";
import { listTeamMembers } from "@/services/team.service";

export default async function ProjectsPage() {
  const [projects, team] = await Promise.all([listProjects(), listTeamMembers()]);
  const owners = team.map((member) => member.name);

  return (
    <RoleGate permission="projects:view">
      <ProjectsWorkspace initialProjects={projects} owners={owners} />
    </RoleGate>
  );
}

import { LeadsWorkspace } from "@/features/clients/components/leads-workspace";
import { listLeads } from "@/services/clients.service";
import { listTeamMembers } from "@/services/team.service";

export default async function LeadsPage() {
  const [leads, team] = await Promise.all([listLeads(), listTeamMembers()]);
  const assignableReps = team.map((member) => ({ code: member.id, name: member.name, initials: member.initials, role: member.role as string, activeLeads: member.leads }));

  return <LeadsWorkspace initialLeads={leads} assignableReps={assignableReps} />;
}

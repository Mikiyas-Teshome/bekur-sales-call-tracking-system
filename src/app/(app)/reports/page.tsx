import { RoleGate } from "@/components/shared/role-gate";
import { ReportsWorkspace } from "@/features/reporting/reports-workspace";
import { hasPermission } from "@/lib/permissions";
import { parseParam } from "@/lib/pagination";
import { isReportPeriod, type ReportPeriod } from "@/lib/report-periods";
import { requireUser } from "@/lib/require-user";
import { getReportsView, listReportPeople, type ReportScope } from "@/services/reports.service";
import { resolveUserId } from "@/services/team.service";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ReportsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const user = await requireUser();
  const canViewTeam = hasPermission(user.permissions, "reports:view_team");

  const requestedPeriod = parseParam(params.period, "This month");
  const period: ReportPeriod = isReportPeriod(requestedPeriod) ? requestedPeriod : "This month";
  const personCode = parseParam(params.person, "");

  const people = canViewTeam ? await listReportPeople() : [];
  const selectedPerson = canViewTeam ? (people.find((person) => person.code === personCode) ?? null) : null;

  let scope: ReportScope = { userId: null };
  let scopeLabel = "Everyone";
  if (!canViewTeam) {
    scope = { userId: user.id };
    scopeLabel = user.name;
  } else if (selectedPerson) {
    scope = { userId: await resolveUserId(selectedPerson.code) };
    scopeLabel = selectedPerson.name;
  }

  const view = await getReportsView({ period, scope, scopeLabel });

  return (
    <RoleGate permission="reports:view">
      <ReportsWorkspace view={view} people={people} filters={{ period, person: selectedPerson?.code ?? "" }} />
    </RoleGate>
  );
}

import { RoleGate } from "@/components/shared/role-gate";
import { CallLogWorkspace } from "@/features/calls/components/call-log-workspace";
import { listAllCalls } from "@/services/calls.service";
import { listTeamMembers } from "@/services/team.service";
import { DEFAULT_PAGE_SIZE, parsePage, parseParam } from "@/lib/pagination";
import { CallOutcome } from "@/entities";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function CallLogPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const search = parseParam(params.search, "");
  const outcome = parseParam(params.outcome, "All outcomes");
  const repCode = parseParam(params.rep, "All reps");

  const [result, team] = await Promise.all([listAllCalls({ page, pageSize: DEFAULT_PAGE_SIZE, search: search || undefined, outcome, repCode }), listTeamMembers()]);

  const repOptions = team.map((member) => ({ code: member.id, name: member.name }));
  const outcomeOptions = Object.values(CallOutcome);

  return (
    <RoleGate permission="leads:view">
      <CallLogWorkspace result={result} repOptions={repOptions} outcomeOptions={outcomeOptions} filters={{ search, outcome, rep: repCode }} />
    </RoleGate>
  );
}

import { LeadsWorkspace } from "@/features/clients/components/leads-workspace";
import { listLeads, listDistinctCampaignNames } from "@/services/clients.service";
import { listTeamMembers } from "@/services/team.service";
import { listCampaigns } from "@/services/campaigns.service";
import { DEFAULT_PAGE_SIZE, parsePage, parseParam } from "@/lib/pagination";
import { PipelineStage } from "@/entities";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LeadsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const search = parseParam(params.search, "");
  const view = parseParam(params.view, "All leads") as "All leads" | "Needs attention" | "No calls yet" | "Overdue follow-up";
  const campaignFilter = parseParam(params.campaign, "All campaigns");
  const stageFilter = parseParam(params.stage, "All stages");
  const sort = parseParam(params.sort, "Newest follow-up") as "Newest follow-up" | "Oldest follow-up" | "Most calls" | "Name A-Z";

  const [result, team, campaignNames, campaigns] = await Promise.all([
    listLeads({ page, pageSize: DEFAULT_PAGE_SIZE, search: search || undefined, campaign: campaignFilter, stage: stageFilter, view, sort }),
    listTeamMembers(),
    listDistinctCampaignNames(),
    listCampaigns(),
  ]);

  const assignableReps = team.map((member) => ({ code: member.id, name: member.name, initials: member.initials, role: member.role as string, activeLeads: member.leads }));
  const campaignOptions = campaigns.map((campaign) => ({ code: campaign.id, name: campaign.name }));
  const stageOptions = Object.values(PipelineStage);

  return (
    <LeadsWorkspace
      result={result}
      assignableReps={assignableReps}
      campaignNames={campaignNames}
      campaignOptions={campaignOptions}
      stageOptions={stageOptions}
      filters={{ search, view, campaign: campaignFilter, stage: stageFilter, sort }}
    />
  );
}

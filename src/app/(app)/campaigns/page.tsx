import { CampaignsWorkspace } from "@/features/campaigns/components/campaigns-workspace";
import { getCampaignsSummary, listCampaignsPage, listDistinctCampaignProjectNames } from "@/services/campaigns.service";
import { listProjects } from "@/services/projects.service";
import { DEFAULT_PAGE_SIZE, parsePage, parseParam } from "@/lib/pagination";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function CampaignsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const search = parseParam(params.search, "");
  const platform = parseParam(params.platform, "All platforms");
  const project = parseParam(params.project, "All projects");
  const status = parseParam(params.status, "All statuses");

  const [result, projects, projectNames, summary] = await Promise.all([
    listCampaignsPage({ page, pageSize: DEFAULT_PAGE_SIZE, search: search || undefined, platform, project, status }),
    listProjects(),
    listDistinctCampaignProjectNames(),
    getCampaignsSummary(),
  ]);

  const projectOptions = projects.map((project) => ({ code: project.id, name: project.name }));

  return <CampaignsWorkspace result={result} projects={projectOptions} projectNames={projectNames} summary={summary} filters={{ search, platform, project, status }} />;
}

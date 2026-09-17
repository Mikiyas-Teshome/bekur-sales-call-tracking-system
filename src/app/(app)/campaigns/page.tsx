import { CampaignsWorkspace } from "@/features/campaigns/components/campaigns-workspace";
import { listCampaigns } from "@/services/campaigns.service";
import { listProjects } from "@/services/projects.service";

export default async function CampaignsPage() {
  const [campaigns, projects] = await Promise.all([listCampaigns(), listProjects()]);
  const projectOptions = projects.map((project) => ({ code: project.id, name: project.name }));

  return <CampaignsWorkspace initialCampaigns={campaigns} projects={projectOptions} />;
}

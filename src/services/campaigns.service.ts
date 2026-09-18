import "server-only";
import { getDataSource } from "@/db/data-source";
import { Call, Campaign, CampaignPlatform, CampaignStatus, Client, PipelineStage } from "@/entities";
import { paginate, type Paginated } from "@/lib/pagination";

async function mapCampaignsWithStats(campaigns: Campaign[]) {
  const dataSource = await getDataSource();
  if (!campaigns.length) return [];

  const campaignIds = campaigns.map((campaign) => campaign.id);

  const leadCounts = await dataSource.getRepository(Client).createQueryBuilder("client").select("client.campaignId", "campaignId").addSelect("COUNT(*)", "count").where("client.campaignId IN (:...campaignIds)", { campaignIds }).groupBy("client.campaignId").getRawMany<{ campaignId: number; count: string }>();

  const callStats = await dataSource
    .getRepository(Call)
    .createQueryBuilder("call")
    .select("call.campaignId", "campaignId")
    .addSelect("COUNT(*)", "calls")
    .addSelect("COUNT(*) FILTER (WHERE call.pipelineStageAfter = :won)", "won")
    .addSelect("COALESCE(SUM(call.dealValue) FILTER (WHERE call.pipelineStageAfter = :won), 0)", "revenue")
    .where("call.deletedAt IS NULL")
    .andWhere("call.campaignId IN (:...campaignIds)", { campaignIds })
    .setParameter("won", PipelineStage.CLOSED_WON)
    .groupBy("call.campaignId")
    .getRawMany<{ campaignId: number; calls: string; won: string; revenue: string }>();

  const leadsByCampaign = new Map(leadCounts.map((row) => [row.campaignId, Number(row.count)]));
  const callsByCampaign = new Map(callStats.map((row) => [row.campaignId, { calls: Number(row.calls), won: Number(row.won), revenue: Number(row.revenue) }]));

  return campaigns.map((campaign) => {
    const stats = callsByCampaign.get(campaign.id) ?? { calls: 0, won: 0, revenue: 0 };

    return {
      id: campaign.code,
      name: campaign.name,
      project: campaign.project?.name ?? "—",
      platform: campaign.platform,
      status: campaign.status,
      owner: "—",
      leads: leadsByCampaign.get(campaign.id) ?? 0,
      calls: stats.calls,
      won: stats.won,
      spend: Number(campaign.adSpend),
      revenue: stats.revenue,
      startDate: campaign.startDate ?? "—",
    };
  });
}

export async function listCampaigns() {
  const dataSource = await getDataSource();
  const campaigns = await dataSource.getRepository(Campaign).find({ relations: { project: true }, order: { createdAt: "DESC" } });
  return mapCampaignsWithStats(campaigns);
}

export type ListCampaignsParams = {
  page: number;
  pageSize: number;
  search?: string;
  platform?: string;
  project?: string;
  status?: string;
};

export async function listCampaignsPage(params: ListCampaignsParams): Promise<Paginated<Awaited<ReturnType<typeof mapCampaignsWithStats>>[number]>> {
  const dataSource = await getDataSource();
  const query = dataSource.getRepository(Campaign).createQueryBuilder("campaign").leftJoinAndSelect("campaign.project", "project").orderBy("campaign.createdAt", "DESC");

  if (params.search) query.andWhere("campaign.name ILIKE :search", { search: `%${params.search}%` });
  if (params.platform && params.platform !== "All platforms") query.andWhere("campaign.platform = :platform", { platform: params.platform });
  if (params.project && params.project !== "All projects") query.andWhere("project.name = :projectName", { projectName: params.project });
  if (params.status && params.status !== "All statuses") query.andWhere("campaign.status = :status", { status: params.status });

  const campaigns = await query.getMany();
  const mapped = await mapCampaignsWithStats(campaigns);

  const start = (params.page - 1) * params.pageSize;
  const pageItems = mapped.slice(start, start + params.pageSize);
  return paginate(pageItems, mapped.length, params.page, params.pageSize);
}

export async function getCampaignsSummary() {
  const dataSource = await getDataSource();
  const totalsRow = await dataSource
    .getRepository(Campaign)
    .createQueryBuilder("campaign")
    .select("COUNT(*)", "total")
    .addSelect("COUNT(*) FILTER (WHERE campaign.status = :active)", "activeCount")
    .addSelect("COALESCE(SUM(campaign.adSpend), 0)", "totalSpend")
    .setParameter("active", CampaignStatus.ACTIVE)
    .getRawOne<{ total: string; activeCount: string; totalSpend: string }>();

  const revenueRow = await dataSource
    .getRepository(Call)
    .createQueryBuilder("call")
    .select("COALESCE(SUM(call.dealValue), 0)", "totalRevenue")
    .where("call.pipelineStageAfter = :won", { won: PipelineStage.CLOSED_WON })
    .andWhere("call.deletedAt IS NULL")
    .getRawOne<{ totalRevenue: string }>();

  return {
    total: Number(totalsRow?.total ?? 0),
    activeCount: Number(totalsRow?.activeCount ?? 0),
    totalSpend: Number(totalsRow?.totalSpend ?? 0),
    totalRevenue: Number(revenueRow?.totalRevenue ?? 0),
  };
}

export async function listDistinctCampaignProjectNames() {
  const dataSource = await getDataSource();
  const rows = await dataSource.getRepository(Campaign).createQueryBuilder("campaign").leftJoin("campaign.project", "project").select("DISTINCT project.name", "name").getRawMany<{ name: string }>();
  return rows.map((row) => row.name).filter(Boolean).sort();
}

export async function resolveCampaignId(code: string) {
  const dataSource = await getDataSource();
  const campaign = await dataSource.getRepository(Campaign).findOne({ where: { code }, select: { id: true } });
  return campaign?.id ?? null;
}

export async function createCampaign(input: { name: string; projectId: number; platform: CampaignPlatform; adSpend: number }) {
  const dataSource = await getDataSource();
  const repo = dataSource.getRepository(Campaign);

  return repo.save(
    repo.create({
      code: `CMP-${Date.now().toString(36).toUpperCase()}`,
      name: input.name,
      projectId: input.projectId,
      platform: input.platform,
      adSpend: String(input.adSpend),
      status: CampaignStatus.ACTIVE,
    }),
  );
}

export async function setCampaignStatus(code: string, status: CampaignStatus) {
  const dataSource = await getDataSource();
  const repo = dataSource.getRepository(Campaign);
  const campaign = await repo.findOneOrFail({ where: { code } });
  campaign.status = status;
  return repo.save(campaign);
}

import "server-only";
import { getDataSource } from "@/db/data-source";
import { Call, Campaign, CampaignPlatform, CampaignStatus, Client, PipelineStage } from "@/entities";

export async function listCampaigns() {
  const dataSource = await getDataSource();
  const campaigns = await dataSource.getRepository(Campaign).find({ relations: { project: true }, order: { createdAt: "DESC" } });

  const leadCounts = await dataSource.getRepository(Client).createQueryBuilder("client").select("client.campaignId", "campaignId").addSelect("COUNT(*)", "count").groupBy("client.campaignId").getRawMany<{ campaignId: number; count: string }>();

  const callStats = await dataSource
    .getRepository(Call)
    .createQueryBuilder("call")
    .select("call.campaignId", "campaignId")
    .addSelect("COUNT(*)", "calls")
    .addSelect("COUNT(*) FILTER (WHERE call.pipelineStageAfter = :won)", "won")
    .addSelect("COALESCE(SUM(call.dealValue) FILTER (WHERE call.pipelineStageAfter = :won), 0)", "revenue")
    .where("call.deletedAt IS NULL")
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

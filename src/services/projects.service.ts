import "server-only";
import { getDataSource } from "@/db/data-source";
import { Client, Call, Campaign, PipelineStage, Project, ProjectStatus } from "@/entities";

export async function listProjects() {
  const dataSource = await getDataSource();
  const projects = await dataSource.getRepository(Project).find({ order: { createdAt: "ASC" } });

  const campaignCounts = await dataSource.getRepository(Campaign).createQueryBuilder("campaign").select("campaign.projectId", "projectId").addSelect("COUNT(*)", "count").groupBy("campaign.projectId").getRawMany<{ projectId: number; count: string }>();

  const leadCounts = await dataSource
    .getRepository(Client)
    .createQueryBuilder("client")
    .leftJoin("client.campaign", "campaign")
    .select("campaign.projectId", "projectId")
    .addSelect("COUNT(*)", "count")
    .groupBy("campaign.projectId")
    .getRawMany<{ projectId: number; count: string }>();

  const revenueRows = await dataSource
    .getRepository(Call)
    .createQueryBuilder("call")
    .select("call.projectId", "projectId")
    .addSelect("COALESCE(SUM(call.dealValue), 0)", "revenue")
    .where("call.pipelineStageAfter = :won", { won: PipelineStage.CLOSED_WON })
    .andWhere("call.deletedAt IS NULL")
    .groupBy("call.projectId")
    .getRawMany<{ projectId: number; revenue: string }>();

  const campaignsByProject = new Map(campaignCounts.map((row) => [row.projectId, Number(row.count)]));
  const leadsByProject = new Map(leadCounts.map((row) => [row.projectId, Number(row.count)]));
  const revenueByProject = new Map(revenueRows.map((row) => [row.projectId, Number(row.revenue)]));

  return projects.map((project) => {
    const actual = revenueByProject.get(project.id) ?? 0;
    const target = Number(project.revenueTarget ?? 0);

    return {
      id: project.code,
      name: project.name,
      description: project.description ?? "",
      status: project.status,
      health: (target > 0 && actual < target * 0.5 ? "At risk" : "On track") as "On track" | "At risk" | "Behind",
      owner: project.ownerName ?? "—",
      campaigns: campaignsByProject.get(project.id) ?? 0,
      leads: leadsByProject.get(project.id) ?? 0,
      members: 1,
      target,
      actual,
      startDate: project.startDate ?? "—",
    };
  });
}

export async function resolveProjectId(code: string) {
  const dataSource = await getDataSource();
  const project = await dataSource.getRepository(Project).findOne({ where: { code }, select: { id: true } });
  return project?.id ?? null;
}

export async function createProject(input: { name: string; description: string; ownerName: string; revenueTarget: number }) {
  const dataSource = await getDataSource();
  const repo = dataSource.getRepository(Project);

  return repo.save(
    repo.create({
      code: `PRJ-${Date.now().toString(36).toUpperCase()}`,
      name: input.name,
      description: input.description || null,
      ownerName: input.ownerName,
      revenueTarget: String(input.revenueTarget),
      status: ProjectStatus.PLANNING,
    }),
  );
}

export async function archiveProject(code: string) {
  const dataSource = await getDataSource();
  const repo = dataSource.getRepository(Project);
  const project = await repo.findOneOrFail({ where: { code } });
  project.status = ProjectStatus.ARCHIVED;
  return repo.save(project);
}

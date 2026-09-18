import "server-only";
import { getDataSource } from "@/db/data-source";
import { Client, Call, Campaign, PipelineStage, Project, ProjectStatus } from "@/entities";
import { paginate, type Paginated } from "@/lib/pagination";

async function mapProjectsWithStats(projects: Project[]) {
  if (!projects.length) return [];
  const dataSource = await getDataSource();
  const projectIds = projects.map((project) => project.id);

  const campaignCounts = await dataSource.getRepository(Campaign).createQueryBuilder("campaign").select("campaign.projectId", "projectId").addSelect("COUNT(*)", "count").where("campaign.projectId IN (:...projectIds)", { projectIds }).groupBy("campaign.projectId").getRawMany<{ projectId: number; count: string }>();

  const leadCounts = await dataSource
    .getRepository(Client)
    .createQueryBuilder("client")
    .leftJoin("client.campaign", "campaign")
    .select("campaign.projectId", "projectId")
    .addSelect("COUNT(*)", "count")
    .where("campaign.projectId IN (:...projectIds)", { projectIds })
    .groupBy("campaign.projectId")
    .getRawMany<{ projectId: number; count: string }>();

  const revenueRows = await dataSource
    .getRepository(Call)
    .createQueryBuilder("call")
    .select("call.projectId", "projectId")
    .addSelect("COALESCE(SUM(call.dealValue), 0)", "revenue")
    .where("call.pipelineStageAfter = :won", { won: PipelineStage.CLOSED_WON })
    .andWhere("call.deletedAt IS NULL")
    .andWhere("call.projectId IN (:...projectIds)", { projectIds })
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

export async function listProjects() {
  const dataSource = await getDataSource();
  const projects = await dataSource.getRepository(Project).find({ order: { createdAt: "ASC" } });
  return mapProjectsWithStats(projects);
}

export type ListProjectsParams = { page: number; pageSize: number; search?: string; status?: string };

export async function listProjectsPage(params: ListProjectsParams): Promise<Paginated<Awaited<ReturnType<typeof mapProjectsWithStats>>[number]>> {
  const dataSource = await getDataSource();
  const query = dataSource.getRepository(Project).createQueryBuilder("project").orderBy("project.createdAt", "ASC");

  if (params.search) query.andWhere("project.name ILIKE :search", { search: `%${params.search}%` });
  if (params.status && params.status !== "All statuses") query.andWhere("project.status = :status", { status: params.status });

  const projects = await query.getMany();
  const mapped = await mapProjectsWithStats(projects);

  const start = (params.page - 1) * params.pageSize;
  const pageItems = mapped.slice(start, start + params.pageSize);
  return paginate(pageItems, mapped.length, params.page, params.pageSize);
}

export async function getProjectsSummary() {
  const dataSource = await getDataSource();
  const totalsRow = await dataSource
    .getRepository(Project)
    .createQueryBuilder("project")
    .select("COUNT(*)", "total")
    .addSelect("COUNT(*) FILTER (WHERE project.status = :active)", "activeCount")
    .setParameter("active", ProjectStatus.ACTIVE)
    .getRawOne<{ total: string; activeCount: string }>();

  const leadsRow = await dataSource
    .getRepository(Client)
    .createQueryBuilder("client")
    .leftJoin("client.campaign", "campaign")
    .select("COUNT(*)", "totalLeads")
    .where("campaign.projectId IS NOT NULL")
    .getRawOne<{ totalLeads: string }>();

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
    totalLeads: Number(leadsRow?.totalLeads ?? 0),
    totalRevenue: Number(revenueRow?.totalRevenue ?? 0),
  };
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

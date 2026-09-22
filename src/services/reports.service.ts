import "server-only";
import { getDataSource } from "@/db/data-source";
import { answeredOutcomes, Call, Campaign, Client, PipelineStage, User } from "@/entities";
import { attainment, emptyKpiValues, kpiMetrics, sumKpiValues, type KpiValues } from "@/lib/kpi-metrics";
import { monthKey, monthKeyLabel, monthKeyRange, resolvePeriodRange, type ReportPeriod } from "@/lib/report-periods";
import { getKpiActuals, getKpiTargets } from "@/services/kpi.service";

const REPORTS_TIMEZONE = process.env.REPORTS_TIMEZONE ?? "Africa/Addis_Ababa";

export type ReportScope = { userId: number | null };

export type ReportPerson = { code: string; name: string; initials: string; role: string };

export type ReportsView = {
  period: ReportPeriod;
  rangeLabel: string;
  scopeLabel: string;
  summary: { label: string; value: string; delta: number | null; detail: string }[];
  revenueTrend: { label: string; revenue: number; leads: number }[];
  revenueTotal: number;
  revenueDelta: number | null;
  funnel: { label: string; count: number; rate: number }[];
  stageConversion: { from: string; to: string; rate: number | null }[];
  conversion: { leadToClose: number | null; avgCallsToClose: number | null; avgDaysToClose: number | null; avgDeal: number | null; cohortLeads: number; wonLeads: number };
  outcomeMix: { label: string; count: number; percentage: number }[];
  callsAnalyzed: number;
  campaigns: { name: string; project: string; leads: number; calls: number; won: number; revenue: number; roas: number | null; share: number }[];
  targets: { monthLabel: string; monthKey: string; metrics: { key: string; label: string; kind: "count" | "currency"; actual: number; target: number; attainment: number | null }[] };
  leaderboard: { code: string; initials: string; name: string; role: string; calls: number; contactRate: number | null; won: number; revenue: number; monthAttainment: number | null; targets: KpiValues; actuals: KpiValues }[];
  heatmap: { days: string[]; blocks: string[]; counts: number[][]; levels: number[][] };
};

const funnelSteps: { label: string; rank: number }[] = [
  { label: "New Lead", rank: 0 },
  { label: "Contacted", rank: 2 },
  { label: "Qualified", rank: 3 },
  { label: "Demo", rank: 4 },
  { label: "Proposal", rank: 5 },
  { label: "Closed Won", rank: 6 },
];

const stageRank: Record<string, number> = {
  [PipelineStage.NEW_LEAD]: 0,
  [PipelineStage.ATTEMPTED_CONTACT]: 1,
  [PipelineStage.CONTACTED]: 2,
  [PipelineStage.QUALIFIED]: 3,
  [PipelineStage.NURTURING]: 3,
  [PipelineStage.DEMO_SCHEDULED]: 4,
  [PipelineStage.DEMO_COMPLETED]: 4,
  [PipelineStage.PROPOSAL_SENT]: 5,
  [PipelineStage.NEGOTIATION]: 5,
  [PipelineStage.CLOSED_WON]: 6,
};

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const blockLabels = ["12a", "2a", "4a", "6a", "8a", "10a", "12p", "2p", "4p", "6p", "8p", "10p"];

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function percentChange(current: number, previous: number) {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function shortDate(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function rangeLabel(from: Date, to: Date) {
  return `${shortDate(from)} – ${to.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

function dayStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function weekStart(date: Date) {
  const start = dayStart(date);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

export async function listReportPeople(): Promise<ReportPerson[]> {
  const dataSource = await getDataSource();
  const users = await dataSource.getRepository(User).find({ where: { active: true }, relations: { role: true }, order: { fullName: "ASC" } });
  return users.map((user) => ({ code: user.code, name: user.fullName, initials: initialsOf(user.fullName), role: user.role.name }));
}

async function periodTotals(scope: ReportScope, from: Date, to: Date) {
  const dataSource = await getDataSource();

  const callQuery = dataSource
    .getRepository(Call)
    .createQueryBuilder("call")
    .select("COUNT(*)", "calls")
    .addSelect("COUNT(DISTINCT call.clientId) FILTER (WHERE call.pipelineStageAfter = :won)", "won")
    .addSelect("COALESCE(SUM(call.dealValue) FILTER (WHERE call.pipelineStageAfter = :won), 0)", "revenue")
    .where("call.deletedAt IS NULL")
    .andWhere("call.calledAt >= :from AND call.calledAt < :to", { from, to })
    .setParameter("won", PipelineStage.CLOSED_WON);
  if (scope.userId) callQuery.andWhere("call.loggedByUserId = :userId", { userId: scope.userId });

  const leadQuery = dataSource.getRepository(Client).createQueryBuilder("client").select("COUNT(*)", "leads").where("client.deletedAt IS NULL").andWhere("client.createdAt >= :from AND client.createdAt < :to", { from, to });
  if (scope.userId) leadQuery.andWhere("client.currentAssignedUserId = :userId", { userId: scope.userId });

  const [callRow, leadRow] = await Promise.all([callQuery.getRawOne<{ calls: string; won: string; revenue: string }>(), leadQuery.getRawOne<{ leads: string }>()]);
  return { calls: Number(callRow?.calls ?? 0), won: Number(callRow?.won ?? 0), revenue: Number(callRow?.revenue ?? 0), leads: Number(leadRow?.leads ?? 0) };
}

async function revenueTrend(scope: ReportScope, from: Date, to: Date) {
  const dataSource = await getDataSource();
  const days = Math.ceil((to.getTime() - from.getTime()) / 86_400_000);
  const unit = days > 45 ? "week" : "day";

  const revenueQuery = dataSource
    .getRepository(Call)
    .createQueryBuilder("call")
    .select(`date_trunc('${unit}', call.calledAt AT TIME ZONE :tz)`, "bucket")
    .addSelect("COALESCE(SUM(call.dealValue), 0)", "revenue")
    .where("call.deletedAt IS NULL")
    .andWhere("call.pipelineStageAfter = :won", { won: PipelineStage.CLOSED_WON })
    .andWhere("call.calledAt >= :from AND call.calledAt < :to", { from, to })
    .setParameter("tz", REPORTS_TIMEZONE)
    .groupBy("bucket");
  if (scope.userId) revenueQuery.andWhere("call.loggedByUserId = :userId", { userId: scope.userId });

  const leadQuery = dataSource
    .getRepository(Client)
    .createQueryBuilder("client")
    .select(`date_trunc('${unit}', client.createdAt)`, "bucket")
    .addSelect("COUNT(*)", "leads")
    .where("client.deletedAt IS NULL")
    .andWhere("client.createdAt >= :from AND client.createdAt < :to", { from, to })
    .groupBy("bucket");
  if (scope.userId) leadQuery.andWhere("client.currentAssignedUserId = :userId", { userId: scope.userId });

  const [revenueRows, leadRows] = await Promise.all([revenueQuery.getRawMany<{ bucket: Date | string; revenue: string }>(), leadQuery.getRawMany<{ bucket: Date | string; leads: string }>()]);

  const keyOf = (value: Date | string) => (unit === "week" ? weekStart(new Date(value)) : dayStart(new Date(value))).toDateString();
  const revenueByBucket = new Map(revenueRows.map((row) => [keyOf(row.bucket), Number(row.revenue)]));
  const leadsByBucket = new Map(leadRows.map((row) => [keyOf(row.bucket), Number(row.leads)]));

  const points: { label: string; revenue: number; leads: number }[] = [];
  let cursor = unit === "week" ? weekStart(from) : dayStart(from);
  while (cursor < to) {
    const key = cursor.toDateString();
    points.push({ label: shortDate(cursor), revenue: revenueByBucket.get(key) ?? 0, leads: leadsByBucket.get(key) ?? 0 });
    cursor = unit === "week" ? new Date(cursor.getTime() + 7 * 86_400_000) : new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
  }
  return points;
}

async function cohortFunnel(scope: ReportScope, from: Date, to: Date) {
  const dataSource = await getDataSource();

  const clientQuery = dataSource.getRepository(Client).createQueryBuilder("client").select("client.id", "id").addSelect("client.pipelineStage", "stage").addSelect("client.createdAt", "createdAt").where("client.deletedAt IS NULL").andWhere("client.createdAt >= :from AND client.createdAt < :to", { from, to });
  if (scope.userId) clientQuery.andWhere("client.currentAssignedUserId = :userId", { userId: scope.userId });
  const clients = await clientQuery.getRawMany<{ id: number; stage: string; createdAt: Date }>();

  const emptyConversion = { leadToClose: null, avgCallsToClose: null, avgDaysToClose: null, avgDeal: null, cohortLeads: 0, wonLeads: 0 };
  if (!clients.length) return { funnel: funnelSteps.map((step) => ({ label: step.label, count: 0, rate: 0 })), stageConversion: [] as { from: string; to: string; rate: number | null }[], conversion: emptyConversion };

  const clientIds = clients.map((client) => Number(client.id));
  const calls = await dataSource
    .getRepository(Call)
    .createQueryBuilder("call")
    .select("call.clientId", "clientId")
    .addSelect("call.pipelineStageAfter", "stage")
    .addSelect("call.calledAt", "calledAt")
    .addSelect("call.dealValue", "dealValue")
    .where("call.deletedAt IS NULL")
    .andWhere("call.clientId IN (:...clientIds)", { clientIds })
    .getRawMany<{ clientId: number; stage: string; calledAt: Date; dealValue: string | null }>();

  const maxRank = new Map<number, number>();
  const callCount = new Map<number, number>();
  const wonAt = new Map<number, Date>();
  const wonValue = new Map<number, number>();
  for (const client of clients) maxRank.set(Number(client.id), stageRank[client.stage] ?? 0);
  for (const call of calls) {
    const clientId = Number(call.clientId);
    callCount.set(clientId, (callCount.get(clientId) ?? 0) + 1);
    const rank = stageRank[call.stage];
    if (rank !== undefined && rank > (maxRank.get(clientId) ?? 0)) maxRank.set(clientId, rank);
    if (call.stage === PipelineStage.CLOSED_WON) {
      const at = new Date(call.calledAt);
      const existing = wonAt.get(clientId);
      if (!existing || at < existing) wonAt.set(clientId, at);
      wonValue.set(clientId, (wonValue.get(clientId) ?? 0) + Number(call.dealValue ?? 0));
    }
  }

  const total = clients.length;
  const funnel = funnelSteps.map((step) => {
    const count = clients.filter((client) => (maxRank.get(Number(client.id)) ?? 0) >= step.rank).length;
    return { label: step.label, count, rate: Math.round((count / total) * 100) };
  });
  const stageConversion = funnel.slice(1).map((step, index) => {
    const previous = funnel[index];
    return { from: previous.label, to: step.label, rate: previous.count > 0 ? Math.round((step.count / previous.count) * 100) : null };
  });

  const wonIds = [...wonAt.keys()];
  const createdById = new Map(clients.map((client) => [Number(client.id), new Date(client.createdAt)]));
  const average = (values: number[]) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null);
  const avgCallsToClose = average(wonIds.map((id) => callCount.get(id) ?? 0));
  const avgDaysToClose = average(wonIds.map((id) => Math.max(0, ((wonAt.get(id)?.getTime() ?? 0) - (createdById.get(id)?.getTime() ?? 0)) / 86_400_000)));
  const revenue = wonIds.reduce((sum, id) => sum + (wonValue.get(id) ?? 0), 0);

  return {
    funnel,
    stageConversion,
    conversion: {
      leadToClose: Math.round((wonIds.length / total) * 1000) / 10,
      avgCallsToClose: avgCallsToClose === null ? null : Math.round(avgCallsToClose * 10) / 10,
      avgDaysToClose: avgDaysToClose === null ? null : Math.round(avgDaysToClose * 10) / 10,
      avgDeal: wonIds.length ? Math.round(revenue / wonIds.length) : null,
      cohortLeads: total,
      wonLeads: wonIds.length,
    },
  };
}

async function outcomeMix(scope: ReportScope, from: Date, to: Date) {
  const dataSource = await getDataSource();
  const query = dataSource.getRepository(Call).createQueryBuilder("call").select("call.outcome", "outcome").addSelect("COUNT(*)", "count").where("call.deletedAt IS NULL").andWhere("call.calledAt >= :from AND call.calledAt < :to", { from, to }).groupBy("call.outcome").orderBy("count", "DESC");
  if (scope.userId) query.andWhere("call.loggedByUserId = :userId", { userId: scope.userId });
  const rows = await query.getRawMany<{ outcome: string; count: string }>();

  const total = rows.reduce((sum, row) => sum + Number(row.count), 0);
  const top = rows.slice(0, 4).map((row) => ({ label: row.outcome, count: Number(row.count) }));
  const rest = rows.slice(4).reduce((sum, row) => sum + Number(row.count), 0);
  if (rest > 0) top.push({ label: "Other", count: rest });
  return { total, mix: top.map((item) => ({ ...item, percentage: total ? Math.round((item.count / total) * 100) : 0 })) };
}

async function campaignPerformance(scope: ReportScope, from: Date, to: Date) {
  const dataSource = await getDataSource();

  const leadQuery = dataSource.getRepository(Client).createQueryBuilder("client").select("client.campaignId", "campaignId").addSelect("COUNT(*)", "leads").where("client.deletedAt IS NULL").andWhere("client.createdAt >= :from AND client.createdAt < :to", { from, to }).groupBy("client.campaignId");
  if (scope.userId) leadQuery.andWhere("client.currentAssignedUserId = :userId", { userId: scope.userId });

  const callQuery = dataSource
    .getRepository(Call)
    .createQueryBuilder("call")
    .select("call.campaignId", "campaignId")
    .addSelect("COUNT(*)", "calls")
    .addSelect("COUNT(DISTINCT call.clientId) FILTER (WHERE call.pipelineStageAfter = :won)", "won")
    .addSelect("COALESCE(SUM(call.dealValue) FILTER (WHERE call.pipelineStageAfter = :won), 0)", "revenue")
    .where("call.deletedAt IS NULL")
    .andWhere("call.calledAt >= :from AND call.calledAt < :to", { from, to })
    .setParameter("won", PipelineStage.CLOSED_WON)
    .groupBy("call.campaignId");
  if (scope.userId) callQuery.andWhere("call.loggedByUserId = :userId", { userId: scope.userId });

  const [leadRows, callRows, campaigns] = await Promise.all([
    leadQuery.getRawMany<{ campaignId: number; leads: string }>(),
    callQuery.getRawMany<{ campaignId: number; calls: string; won: string; revenue: string }>(),
    dataSource.getRepository(Campaign).find({ relations: { project: true }, order: { name: "ASC" } }),
  ]);

  const leadsBy = new Map(leadRows.map((row) => [Number(row.campaignId), Number(row.leads)]));
  const callsBy = new Map(callRows.map((row) => [Number(row.campaignId), row]));
  const rows = campaigns
    .map((campaign) => {
      const callRow = callsBy.get(campaign.id);
      const revenue = Number(callRow?.revenue ?? 0);
      const adSpend = Number(campaign.adSpend ?? 0);
      return { name: campaign.name, project: campaign.project?.name ?? "—", leads: leadsBy.get(campaign.id) ?? 0, calls: Number(callRow?.calls ?? 0), won: Number(callRow?.won ?? 0), revenue, roas: adSpend > 0 ? Math.round((revenue / adSpend) * 10) / 10 : null, share: 0 };
    })
    .filter((row) => row.leads > 0 || row.calls > 0)
    .sort((a, b) => b.revenue - a.revenue || b.leads - a.leads);
  const maxLeads = Math.max(...rows.map((row) => row.leads), 1);
  return rows.map((row) => ({ ...row, share: Math.round((row.leads / maxLeads) * 100) }));
}

async function activityHeatmap(scope: ReportScope, from: Date, to: Date) {
  const dataSource = await getDataSource();
  const query = dataSource
    .getRepository(Call)
    .createQueryBuilder("call")
    .select("EXTRACT(DOW FROM (call.calledAt AT TIME ZONE :tz))", "dow")
    .addSelect("FLOOR(EXTRACT(HOUR FROM (call.calledAt AT TIME ZONE :tz)) / 2)", "block")
    .addSelect("COUNT(*)", "count")
    .where("call.deletedAt IS NULL")
    .andWhere("call.calledAt >= :from AND call.calledAt < :to", { from, to })
    .setParameter("tz", REPORTS_TIMEZONE)
    .groupBy("dow")
    .addGroupBy("block");
  if (scope.userId) query.andWhere("call.loggedByUserId = :userId", { userId: scope.userId });
  const rows = await query.getRawMany<{ dow: string; block: string; count: string }>();

  const counts = dayLabels.map(() => blockLabels.map(() => 0));
  for (const row of rows) counts[Number(row.dow)][Number(row.block)] = Number(row.count);
  const max = Math.max(...counts.flat(), 0);
  const levels = counts.map((row) => row.map((count) => (count === 0 || max === 0 ? 0 : Math.max(1, Math.ceil((count / max) * 3)))));
  return { days: dayLabels, blocks: blockLabels, counts, levels };
}

async function leaderboard(scope: ReportScope, from: Date, to: Date, currentMonth: string) {
  const dataSource = await getDataSource();
  const userQuery = dataSource.getRepository(User).createQueryBuilder("user").leftJoinAndSelect("user.role", "role").where("user.active = true").orderBy("user.fullName", "ASC");
  if (scope.userId) userQuery.andWhere("user.id = :userId", { userId: scope.userId });
  const users = await userQuery.getMany();
  if (!users.length) return [];
  const userIds = users.map((user) => user.id);

  const reachQuery = dataSource
    .getRepository(Call)
    .createQueryBuilder("call")
    .select("call.loggedByUserId", "userId")
    .addSelect("COUNT(DISTINCT call.clientId)", "clientsCalled")
    .addSelect("COUNT(DISTINCT call.clientId) FILTER (WHERE call.outcome IN (:...answered))", "clientsReached")
    .where("call.deletedAt IS NULL")
    .andWhere("call.loggedByUserId IN (:...userIds)", { userIds })
    .andWhere("call.calledAt >= :from AND call.calledAt < :to", { from, to })
    .setParameter("answered", answeredOutcomes)
    .groupBy("call.loggedByUserId");

  const month = monthKeyRange(currentMonth);
  const [periodActuals, reachRows, monthActuals, monthTargets] = await Promise.all([
    getKpiActuals(userIds, from, to),
    reachQuery.getRawMany<{ userId: number; clientsCalled: string; clientsReached: string }>(),
    getKpiActuals(userIds, month.from, month.to),
    getKpiTargets(userIds, currentMonth),
  ]);
  const reachBy = new Map(reachRows.map((row) => [Number(row.userId), row]));

  return users
    .map((user) => {
      const actual = periodActuals.get(user.id) ?? emptyKpiValues();
      const reach = reachBy.get(user.id);
      const called = Number(reach?.clientsCalled ?? 0);
      const targets = monthTargets.get(user.id) ?? emptyKpiValues();
      const actuals = monthActuals.get(user.id) ?? emptyKpiValues();
      const attainments = kpiMetrics.map((metric) => attainment(actuals[metric.key], targets[metric.key])).filter((value): value is number => value !== null);
      return {
        code: user.code,
        initials: initialsOf(user.fullName),
        name: user.fullName,
        role: user.role.name,
        calls: actual.calls,
        contactRate: called > 0 ? Math.round((Number(reach?.clientsReached ?? 0) / called) * 100) : null,
        won: actual.dealsWon,
        revenue: actual.revenue,
        monthAttainment: attainments.length ? Math.round(attainments.reduce((sum, value) => sum + value, 0) / attainments.length) : null,
        targets,
        actuals,
      };
    })
    .sort((a, b) => b.revenue - a.revenue || b.won - a.won || b.calls - a.calls);
}

export async function getReportsView(input: { period: ReportPeriod; scope: ReportScope; scopeLabel: string }): Promise<ReportsView> {
  const { from, to, previousFrom, previousTo } = resolvePeriodRange(input.period);
  const currentMonth = monthKey();

  const [current, previous, trend, cohort, outcomes, campaigns, heatmap, people] = await Promise.all([
    periodTotals(input.scope, from, to),
    periodTotals(input.scope, previousFrom, previousTo),
    revenueTrend(input.scope, from, to),
    cohortFunnel(input.scope, from, to),
    outcomeMix(input.scope, from, to),
    campaignPerformance(input.scope, from, to),
    activityHeatmap(input.scope, from, to),
    leaderboard(input.scope, from, to, currentMonth),
  ]);

  const targetTotals = sumKpiValues(people.map((person) => person.targets));
  const actualTotals = sumKpiValues(people.map((person) => person.actuals));
  const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const conversionRate = current.leads > 0 ? Math.round((current.won / current.leads) * 1000) / 10 : null;

  return {
    period: input.period,
    rangeLabel: rangeLabel(from, to),
    scopeLabel: input.scopeLabel,
    summary: [
      { label: "New leads", value: String(current.leads), delta: percentChange(current.leads, previous.leads), detail: "vs previous period" },
      { label: "Calls made", value: String(current.calls), delta: percentChange(current.calls, previous.calls), detail: people.length > 1 ? `across ${people.length} people` : "in this period" },
      { label: "Closed won", value: String(current.won), delta: percentChange(current.won, previous.won), detail: conversionRate === null ? "no new leads yet" : `${conversionRate}% of new leads` },
      { label: "Revenue", value: currency.format(current.revenue), delta: percentChange(current.revenue, previous.revenue), detail: current.won > 0 ? `${currency.format(current.revenue / current.won)} avg deal` : "no deals closed" },
    ],
    revenueTrend: trend,
    revenueTotal: current.revenue,
    revenueDelta: percentChange(current.revenue, previous.revenue),
    funnel: cohort.funnel,
    stageConversion: cohort.stageConversion,
    conversion: cohort.conversion,
    outcomeMix: outcomes.mix,
    callsAnalyzed: outcomes.total,
    campaigns,
    targets: {
      monthLabel: monthKeyLabel(currentMonth),
      monthKey: currentMonth,
      metrics: kpiMetrics.map((metric) => ({ key: metric.key, label: metric.label, kind: metric.kind, actual: actualTotals[metric.key], target: targetTotals[metric.key], attainment: attainment(actualTotals[metric.key], targetTotals[metric.key]) })),
    },
    leaderboard: people,
    heatmap,
  };
}

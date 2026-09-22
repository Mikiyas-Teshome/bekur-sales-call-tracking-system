import "server-only";
import { getDataSource } from "@/db/data-source";
import { answeredOutcomes, callOutcomeTone, closedPipelineStages, midFunnelStages, Call, Client, PipelineStage } from "@/entities";

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function minutesAgoLabel(date: Date) {
  const minutes = Math.round((Date.now() - date.getTime()) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export async function getTodayKpis() {
  const dataSource = await getDataSource();
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);

  const [leadsAssigned, callsThisWeek, callsLastWeek, answeredThisWeek, revenueRow] = await Promise.all([
    dataSource.getRepository(Client).count(),
    dataSource.getRepository(Call).createQueryBuilder("call").where("call.calledAt >= :weekAgo", { weekAgo }).andWhere("call.deletedAt IS NULL").getCount(),
    dataSource
      .getRepository(Call)
      .createQueryBuilder("call")
      .where("call.calledAt >= :twoWeeksAgo", { twoWeeksAgo: new Date(Date.now() - 14 * 86_400_000) })
      .andWhere("call.calledAt < :weekAgo", { weekAgo })
      .andWhere("call.deletedAt IS NULL")
      .getCount(),
    dataSource
      .getRepository(Call)
      .createQueryBuilder("call")
      .where("call.calledAt >= :weekAgo", { weekAgo })
      .andWhere("call.outcome IN (:...answered)", { answered: answeredOutcomes })
      .andWhere("call.deletedAt IS NULL")
      .getCount(),
    dataSource
      .getRepository(Call)
      .createQueryBuilder("call")
      .select("COALESCE(SUM(call.dealValue), 0)", "total")
      .where("call.pipelineStageAfter = :won", { won: PipelineStage.CLOSED_WON })
      .andWhere("call.deletedAt IS NULL")
      .getRawOne<{ total: string }>(),
  ]);

  const callsDelta = callsLastWeek === 0 ? 0 : Math.round(((callsThisWeek - callsLastWeek) / callsLastWeek) * 100);
  const contactRate = callsThisWeek === 0 ? 0 : Math.round((answeredThisWeek / callsThisWeek) * 100);

  return {
    leadsAssigned,
    callsThisWeek,
    callsDelta,
    contactRate,
    revenueWon: Number(revenueRow?.total ?? 0),
  };
}

export async function getFollowUps() {
  const dataSource = await getDataSource();
  const calls = await dataSource
    .getRepository(Call)
    .createQueryBuilder("call")
    .leftJoinAndSelect("call.client", "client")
    .where("call.nextFollowUpDate IS NOT NULL")
    .andWhere("call.deletedAt IS NULL")
    .andWhere("client.pipelineStage NOT IN (:...closed)", { closed: closedPipelineStages })
    .orderBy("call.nextFollowUpDate", "ASC")
    .limit(8)
    .getMany();

  const seen = new Set<number>();
  return calls.filter((call) => {
    if (seen.has(call.clientId)) return false;
    seen.add(call.clientId);
    return true;
  });
}

export async function getOverdueLeadsByAssignee() {
  const dataSource = await getDataSource();
  const today = new Date().toISOString().slice(0, 10);

  const rows = await dataSource
    .getRepository(Client)
    .createQueryBuilder("client")
    .select("client.currentAssignedUserId", "userId")
    .addSelect("COUNT(*)", "count")
    .where("client.pipelineStage NOT IN (:...closed)", { closed: closedPipelineStages })
    .andWhere("client.currentAssignedUserId IS NOT NULL")
    .andWhere((qb) => {
      const subQuery = qb.subQuery().select("MAX(c.nextFollowUpDate)").from(Call, "c").where("c.clientId = client.id").andWhere("c.nextFollowUpDate IS NOT NULL").getQuery();
      return `(${subQuery}) < :today`;
    })
    .setParameter("today", today)
    .groupBy("client.currentAssignedUserId")
    .getRawMany<{ userId: number; count: string }>();

  return rows.map((row) => ({ userId: row.userId, count: Number(row.count) }));
}

export async function getAttentionCounts() {
  const dataSource = await getDataSource();
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86_400_000);

  const neverCalled = await dataSource
    .getRepository(Client)
    .createQueryBuilder("client")
    .leftJoin("client.calls", "call")
    .where("call.id IS NULL")
    .getCount();

  const overdue = await dataSource
    .getRepository(Call)
    .createQueryBuilder("call")
    .where("call.nextFollowUpDate < :today", { today: new Date().toISOString().slice(0, 10) })
    .andWhere("call.deletedAt IS NULL")
    .getCount();

  const goneQuiet = await dataSource
    .getRepository(Client)
    .createQueryBuilder("client")
    .leftJoin("client.calls", "call")
    .where("client.pipelineStage NOT IN (:...closed)", { closed: closedPipelineStages })
    .andWhere((qb) => {
      const subQuery = qb.subQuery().select("MAX(c.calledAt)").from(Call, "c").where("c.clientId = client.id").getQuery();
      return `(${subQuery}) < :fourteenDaysAgo`;
    })
    .setParameter("fourteenDaysAgo", fourteenDaysAgo)
    .getCount();

  return { neverCalled, overdue, goneQuiet };
}

export async function getRecentActivity() {
  const dataSource = await getDataSource();
  return dataSource
    .getRepository(Call)
    .createQueryBuilder("call")
    .leftJoinAndSelect("call.client", "client")
    .where("call.deletedAt IS NULL")
    .orderBy("call.calledAt", "DESC")
    .limit(5)
    .getMany();
}

export async function getPipelineCounts() {
  const dataSource = await getDataSource();
  const rows = await dataSource
    .getRepository(Client)
    .createQueryBuilder("client")
    .select("client.pipelineStage", "stage")
    .addSelect("COUNT(*)", "count")
    .where("client.deletedAt IS NULL")
    .groupBy("client.pipelineStage")
    .getRawMany<{ stage: PipelineStage; count: string }>();

  return rows.map((row) => ({ stage: row.stage, count: Number(row.count) }));
}

export async function getWeeklyCallVolume() {
  const dataSource = await getDataSource();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const rows = await dataSource
    .getRepository(Call)
    .createQueryBuilder("call")
    .select("DATE(call.calledAt)", "day")
    .addSelect("COUNT(*)", "count")
    .where("call.calledAt >= :sevenDaysAgo", { sevenDaysAgo })
    .andWhere("call.deletedAt IS NULL")
    .groupBy("DATE(call.calledAt)")
    .getRawMany<{ day: string; count: string }>();

  const countsByDay = new Map(rows.map((row) => [String(row.day).slice(0, 10), Number(row.count)]));
  const days: { label: string; count: number }[] = [];
  for (let offset = 6; offset >= 0; offset--) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    const key = date.toISOString().slice(0, 10);
    days.push({ label: date.toLocaleDateString("en-US", { weekday: "short" }), count: countsByDay.get(key) ?? 0 });
  }
  return days;
}

export async function getTodayDashboardView() {
  const [kpis, followUps, attention, recent, pipeline, weekly] = await Promise.all([getTodayKpis(), getFollowUps(), getAttentionCounts(), getRecentActivity(), getPipelineCounts(), getWeeklyCallVolume()]);

  const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const today = new Date().toISOString().slice(0, 10);

  const todayKpis = [
    { label: "Leads assigned", value: String(kpis.leadsAssigned), delta: "", detail: "total in workspace" },
    { label: "Calls made", value: String(kpis.callsThisWeek), delta: `${kpis.callsDelta >= 0 ? "+" : ""}${kpis.callsDelta}%`, detail: "vs last week" },
    { label: "Contact rate", value: `${kpis.contactRate}%`, delta: "", detail: "this week" },
    { label: "Revenue won", value: currency.format(kpis.revenueWon), delta: "", detail: "all time" },
  ];

  const todayFollowUps = followUps.map((call) => {
    const overdue = call.nextFollowUpDate !== null && call.nextFollowUpDate < today;
    const dueTodayFlag = call.nextFollowUpDate === today;
    return {
      initials: initialsOf(call.client.displayName),
      name: call.client.displayName,
      company: call.client.businessName ?? "—",
      stage: call.client.pipelineStage,
      due: overdue ? "Overdue" : dueTodayFlag ? "Due today" : call.nextFollowUpDate ? new Date(`${call.nextFollowUpDate}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—",
      tone: overdue ? "destructive" : dueTodayFlag ? "warning" : "primary",
      clientCode: call.client.code,
    };
  });

  const attentionItems = [
    { label: "Never called", count: attention.neverCalled, detail: "new leads waiting for first contact", tone: "primary" },
    { label: "Overdue follow-up", count: attention.overdue, detail: "conversations that need a response", tone: "destructive" },
    { label: "Gone quiet", count: attention.goneQuiet, detail: "open leads with no recent activity", tone: "warning" },
  ];

  const recentCalls = recent.map((call) => ({
    initials: initialsOf(call.client.displayName),
    name: call.client.displayName,
    outcome: call.outcome as string,
    note: call.outcomeNote ?? "",
    time: minutesAgoLabel(call.calledAt),
    tone: callOutcomeTone(call.outcome),
  }));

  const pipelineByStage = new Map(pipeline.map((row) => [row.stage, row.count]));
  const maxPipelineCount = Math.max(...midFunnelStages.map((stage) => pipelineByStage.get(stage) ?? 0), 1);
  const pipelineMomentum = midFunnelStages.map((stage) => {
    const value = pipelineByStage.get(stage) ?? 0;
    return { label: stage as string, value, width: `${Math.round((value / maxPipelineCount) * 100)}%` };
  });

  const maxWeekly = Math.max(...weekly.map((day) => day.count), 1);
  const weeklyCalls = weekly.map((day) => Math.max(6, Math.round((day.count / maxWeekly) * 100)));
  const callsThisWeekTotal = weekly.reduce((sum, day) => sum + day.count, 0);

  return { todayKpis, todayFollowUps, attentionItems, recentCalls, pipelineMomentum, weeklyCalls, weeklyDayLabels: weekly.map((day) => day.label), callsThisWeekTotal, revenueWon: kpis.revenueWon, contactRate: kpis.contactRate };
}

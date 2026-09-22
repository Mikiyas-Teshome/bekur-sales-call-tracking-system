import "server-only";
import { getDataSource } from "@/db/data-source";
import { answeredOutcomes, Call, CallOutcome, KpiTarget, PipelineStage } from "@/entities";
import { emptyKpiValues, type KpiValues } from "@/lib/kpi-metrics";

const demoStages = [PipelineStage.DEMO_SCHEDULED, PipelineStage.DEMO_COMPLETED];

export async function getKpiActuals(userIds: number[], from: Date, to: Date): Promise<Map<number, KpiValues>> {
  const result = new Map<number, KpiValues>();
  if (!userIds.length) return result;

  const dataSource = await getDataSource();
  const rows = await dataSource
    .getRepository(Call)
    .createQueryBuilder("call")
    .select("call.loggedByUserId", "userId")
    .addSelect("COUNT(*)", "calls")
    .addSelect("COUNT(DISTINCT call.clientId) FILTER (WHERE call.outcome IN (:...answered))", "contacts")
    .addSelect("COUNT(DISTINCT call.clientId) FILTER (WHERE call.outcome = :demoOutcome OR call.pipelineStageAfter IN (:...demoStages))", "demos")
    .addSelect("COUNT(DISTINCT call.clientId) FILTER (WHERE call.pipelineStageAfter = :won)", "dealsWon")
    .addSelect("COALESCE(SUM(call.dealValue) FILTER (WHERE call.pipelineStageAfter = :won), 0)", "revenue")
    .where("call.deletedAt IS NULL")
    .andWhere("call.loggedByUserId IN (:...userIds)", { userIds })
    .andWhere("call.calledAt >= :from AND call.calledAt < :to", { from, to })
    .setParameters({ answered: answeredOutcomes, demoOutcome: CallOutcome.ANSWERED_REQUESTED_DEMO, demoStages, won: PipelineStage.CLOSED_WON })
    .groupBy("call.loggedByUserId")
    .getRawMany<{ userId: number; calls: string; contacts: string; demos: string; dealsWon: string; revenue: string }>();

  for (const userId of userIds) result.set(userId, emptyKpiValues());
  for (const row of rows) {
    result.set(Number(row.userId), { calls: Number(row.calls), contacts: Number(row.contacts), demos: Number(row.demos), dealsWon: Number(row.dealsWon), revenue: Number(row.revenue) });
  }
  return result;
}

export function targetToValues(target: KpiTarget | null | undefined): KpiValues {
  if (!target) return emptyKpiValues();
  return { calls: target.callsTarget, contacts: target.contactsTarget, demos: target.demosTarget, dealsWon: target.dealsWonTarget, revenue: Number(target.revenueTarget) };
}

export async function getKpiTargets(userIds: number[], period: string): Promise<Map<number, KpiValues>> {
  const result = new Map<number, KpiValues>();
  if (!userIds.length) return result;

  const dataSource = await getDataSource();
  const targets = await dataSource.getRepository(KpiTarget).find({ where: userIds.map((userId) => ({ userId, period })) });
  for (const target of targets) result.set(target.userId, targetToValues(target));
  return result;
}

export async function getKpiTargetForUser(userId: number, period: string) {
  const dataSource = await getDataSource();
  const target = await dataSource.getRepository(KpiTarget).findOne({ where: { userId, period } });
  return { values: targetToValues(target), exists: Boolean(target) };
}

export async function saveKpiTarget(input: { userId: number; period: string; values: KpiValues; setByUserId: number }) {
  const dataSource = await getDataSource();
  const repo = dataSource.getRepository(KpiTarget);
  const existing = await repo.findOne({ where: { userId: input.userId, period: input.period } });
  const target = existing ?? repo.create({ userId: input.userId, period: input.period });

  target.callsTarget = Math.round(input.values.calls);
  target.contactsTarget = Math.round(input.values.contacts);
  target.demosTarget = Math.round(input.values.demos);
  target.dealsWonTarget = Math.round(input.values.dealsWon);
  target.revenueTarget = input.values.revenue.toFixed(2);
  target.setByUserId = input.setByUserId;
  return repo.save(target);
}

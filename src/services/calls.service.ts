import "server-only";
import { getDataSource } from "@/db/data-source";
import { Call, CallOutcome, Client, PipelineStage } from "@/entities";
import { paginate, type Paginated } from "@/lib/pagination";

export type CallLogRow = {
  id: string;
  clientCode: string;
  clientName: string;
  clientPhone: string;
  outcome: string;
  stage: string;
  note: string;
  date: string;
  calledAt: string;
  value: string | null;
  rep: string;
  campaign: string;
  project: string;
};

export type ListAllCallsParams = {
  page: number;
  pageSize: number;
  search?: string;
  outcome?: string;
  repCode?: string;
};

export async function listAllCalls(params: ListAllCallsParams): Promise<Paginated<CallLogRow>> {
  const dataSource = await getDataSource();
  const query = dataSource
    .getRepository(Call)
    .createQueryBuilder("call")
    .leftJoinAndSelect("call.client", "client")
    .leftJoinAndSelect("call.loggedByUser", "loggedByUser")
    .leftJoinAndSelect("call.campaign", "campaign")
    .leftJoinAndSelect("call.project", "project")
    .where("call.deletedAt IS NULL")
    .orderBy("call.calledAt", "DESC");

  if (params.search) {
    query.andWhere("(client.displayName ILIKE :search OR client.phone ILIKE :search)", { search: `%${params.search}%` });
  }
  if (params.outcome && params.outcome !== "All outcomes") {
    query.andWhere("call.outcome = :outcome", { outcome: params.outcome });
  }
  if (params.repCode && params.repCode !== "All reps") {
    query.andWhere("loggedByUser.code = :repCode", { repCode: params.repCode });
  }

  const total = await query.getCount();
  const start = (params.page - 1) * params.pageSize;
  const calls = await query.skip(start).take(params.pageSize).getMany();

  const items: CallLogRow[] = calls.map((call) => ({
    id: `call-${call.id}`,
    clientCode: call.client.code,
    clientName: call.client.displayName,
    clientPhone: call.client.phone,
    outcome: call.outcome as string,
    stage: call.pipelineStageAfter as string,
    note: call.outcomeNote ?? "",
    date: call.calledAt.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).replace(",", " ·"),
    calledAt: call.calledAt.toISOString(),
    value: call.dealValue ? `$${Number(call.dealValue).toLocaleString()}` : null,
    rep: call.loggedByUser.fullName,
    campaign: call.campaign?.name ?? "—",
    project: call.project?.name ?? "—",
  }));

  return paginate(items, total, params.page, params.pageSize);
}

export async function getCallHistory(clientId: number) {
  const dataSource = await getDataSource();
  return dataSource
    .getRepository(Call)
    .createQueryBuilder("call")
    .leftJoinAndSelect("call.loggedByUser", "loggedByUser")
    .where("call.clientId = :clientId", { clientId })
    .andWhere("call.deletedAt IS NULL")
    .orderBy("call.calledAt", "DESC")
    .getMany();
}

export async function getCallHistoryView(clientId: number) {
  const calls = await getCallHistory(clientId);

  return calls.map((call) => ({
    id: `call-${call.id}`,
    outcome: call.outcome as string,
    stage: call.pipelineStageAfter as string,
    note: call.outcomeNote ?? "",
    date: call.calledAt.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).replace(",", " ·"),
    value: call.dealValue ? `$${Number(call.dealValue).toLocaleString()}` : null,
    rep: call.loggedByUser.fullName,
  }));
}

export async function logCall(input: {
  clientId: number;
  loggedByUserId: number;
  outcome: CallOutcome;
  outcomeNote: string | null;
  pipelineStageAfter: PipelineStage;
  dealValue: string | null;
  nextFollowUpDate: string | null;
}) {
  const dataSource = await getDataSource();

  const call = await dataSource.transaction(async (manager) => {
    const client = await manager.getRepository(Client).findOneOrFail({ where: { id: input.clientId }, relations: { campaign: true } });

    const savedCall = await manager.getRepository(Call).save(
      manager.getRepository(Call).create({
        clientId: client.id,
        loggedByUserId: input.loggedByUserId,
        campaignId: client.campaignId,
        projectId: client.campaign.projectId,
        calledAt: new Date(),
        outcome: input.outcome,
        outcomeNote: input.outcomeNote,
        pipelineStageAfter: input.pipelineStageAfter,
        dealValue: input.dealValue,
        nextFollowUpDate: input.nextFollowUpDate,
      }),
    );

    client.pipelineStage = input.pipelineStageAfter;
    await manager.getRepository(Client).save(client);

    return { savedCall, clientName: client.displayName };
  });

  if (input.pipelineStageAfter === PipelineStage.CLOSED_WON) {
    try {
      const { listUserIdsWithPermission } = await import("@/services/roles.service");
      const { notify } = await import("@/services/notifications.service");
      const managerIds = (await listUserIdsWithPermission("dashboard:view_team_scope")).filter((id) => id !== input.loggedByUserId);
      if (managerIds.length) await notify(managerIds, "team-activity", { title: "Deal closed 🎉", body: `${call.clientName} was just marked Closed Won.`, url: "/leads" });
    } catch (error) {
      console.error("Team activity notification failed", error);
    }
  }

  return call.savedCall;
}

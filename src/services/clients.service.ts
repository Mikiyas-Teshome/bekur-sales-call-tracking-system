import "server-only";
import { getDataSource } from "@/db/data-source";
import { Client, ClientAssignment, PipelineStage } from "@/entities";
import { normalizePhone } from "@/lib/phone";
import type { Lead } from "@/features/clients/fixtures/leads.fixture";

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function daysAgoLabel(date: Date | null) {
  if (!date) return "No calls";
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function followUpLabel(nextFollowUpDate: string | null) {
  if (!nextFollowUpDate) return "No follow-up set";
  const due = new Date(`${nextFollowUpDate}T00:00:00`);
  const days = Math.round((due.getTime() - Date.now()) / 86_400_000);
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
  if (days === 0) return "Today";
  return due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function attentionOf(nextFollowUpDate: string | null, callCount: number): Lead["attention"] {
  if (callCount === 0) return "today";
  if (!nextFollowUpDate) return "clear";
  const days = Math.round((new Date(`${nextFollowUpDate}T00:00:00`).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  return "clear";
}

function mapClientToLead(client: Client): Lead {
  const calls = client.calls ?? [];
  const lastCall = calls.length ? calls.reduce((latest, call) => (call.calledAt > latest.calledAt ? call : latest)) : null;
  const nextFollowUpDate = lastCall?.nextFollowUpDate ?? null;

  return {
    id: client.code,
    initials: initialsOf(client.displayName),
    name: client.displayName,
    business: client.businessName ?? "—",
    phone: client.phone,
    campaign: client.campaign?.name ?? "—",
    project: client.campaign?.project?.name ?? "—",
    stage: client.pipelineStage,
    assignee: client.currentAssignedUser?.fullName ?? "Unassigned",
    lastCall: daysAgoLabel(lastCall?.calledAt ?? null),
    nextFollowUp: followUpLabel(nextFollowUpDate),
    callCount: calls.length,
    attention: attentionOf(nextFollowUpDate, calls.length),
  };
}

export async function listLeads(): Promise<Lead[]> {
  const dataSource = await getDataSource();
  const clients = await dataSource
    .getRepository(Client)
    .createQueryBuilder("client")
    .leftJoinAndSelect("client.campaign", "campaign")
    .leftJoinAndSelect("campaign.project", "project")
    .leftJoinAndSelect("client.currentAssignedUser", "assignee")
    .leftJoinAndSelect("client.calls", "call", "call.deletedAt IS NULL")
    .orderBy("client.createdAt", "DESC")
    .getMany();

  return clients.map(mapClientToLead);
}

export async function getLeadDetail(code: string) {
  const dataSource = await getDataSource();
  const client = await dataSource
    .getRepository(Client)
    .createQueryBuilder("client")
    .leftJoinAndSelect("client.campaign", "campaign")
    .leftJoinAndSelect("campaign.project", "project")
    .leftJoinAndSelect("client.currentAssignedUser", "assignee")
    .leftJoinAndSelect("client.calls", "call", "call.deletedAt IS NULL")
    .where("client.code = :code", { code })
    .getOne();

  if (!client) return null;

  const firstContactDate = client.firstContactDate ? new Date(`${client.firstContactDate}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—";

  return { clientId: client.id, lead: mapClientToLead(client), firstContactDate };
}

export async function listAssignedLeadsForUser(userId: number) {
  const dataSource = await getDataSource();
  const clients = await dataSource.getRepository(Client).find({ where: { currentAssignedUserId: userId }, order: { createdAt: "DESC" } });

  return clients.map((client) => ({ code: client.code, name: client.displayName, business: client.businessName ?? "—", stage: client.pipelineStage as string }));
}

export async function resolveClientId(code: string) {
  const dataSource = await getDataSource();
  const client = await dataSource.getRepository(Client).findOne({ where: { code }, select: { id: true } });
  return client?.id ?? null;
}

export async function getClientAssignmentHistory(clientId: number) {
  const dataSource = await getDataSource();
  const assignments = await dataSource
    .getRepository(ClientAssignment)
    .createQueryBuilder("assignment")
    .leftJoinAndSelect("assignment.user", "user")
    .leftJoinAndSelect("assignment.assignedByUser", "assignedBy")
    .where("assignment.clientId = :clientId", { clientId })
    .orderBy("assignment.assignedAt", "ASC")
    .getMany();

  return assignments.map((assignment, index) => ({
    from: index === 0 ? "Unassigned" : (assignments[index - 1].user?.fullName ?? "Unassigned"),
    to: assignment.user?.fullName ?? "Unassigned",
    by: assignment.assignedByUser.fullName,
    date: assignment.assignedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
  }));
}

async function notifyNewLeads(count: number, summary: string) {
  if (count <= 0) return;
  try {
    const { listUserIdsWithPermission } = await import("@/services/roles.service");
    const { notify } = await import("@/services/notifications.service");
    const managerIds = await listUserIdsWithPermission("dashboard:view_team_scope");
    if (managerIds.length) await notify(managerIds, "new-lead", { title: "New lead", body: summary, url: "/leads" });
  } catch (error) {
    console.error("New lead notification failed", error);
  }
}

export async function createClient(input: { displayName: string; phone: string; businessName?: string; campaignId: number; assignedUserId?: number | null }) {
  const dataSource = await getDataSource();
  const repo = dataSource.getRepository(Client);
  const phoneNormalized = normalizePhone(input.phone);

  const existing = await repo.findOne({ where: { phoneNormalized } });
  if (existing) throw new Error(`This number already exists as ${existing.code}`);

  const code = await nextClientCode(dataSource);
  const client = await repo.save(
    repo.create({
      code,
      displayName: input.displayName,
      phone: input.phone,
      businessName: input.businessName ?? null,
      campaignId: input.campaignId,
      currentAssignedUserId: input.assignedUserId ?? null,
      firstContactDate: new Date().toISOString().slice(0, 10),
      pipelineStage: PipelineStage.NEW_LEAD,
    }),
  );

  await notifyNewLeads(1, `${client.displayName} was just added as a new lead.`);
  return client;
}

export async function bulkImportClients(input: { phones: string[]; campaignId: number }) {
  const dataSource = await getDataSource();
  const repo = dataSource.getRepository(Client);
  const existingPhones = new Set((await repo.find({ select: { phoneNormalized: true } })).map((client) => client.phoneNormalized));

  let created = 0;
  for (const phone of input.phones) {
    const phoneNormalized = normalizePhone(phone);
    if (existingPhones.has(phoneNormalized)) continue;
    existingPhones.add(phoneNormalized);

    const code = await nextClientCode(dataSource);
    await repo.save(
      repo.create({
        code,
        displayName: `+${phoneNormalized}`,
        phone,
        campaignId: input.campaignId,
        firstContactDate: new Date().toISOString().slice(0, 10),
        pipelineStage: PipelineStage.NEW_LEAD,
      }),
    );
    created += 1;
  }

  await notifyNewLeads(created, `${created} new lead${created === 1 ? "" : "s"} were imported.`);
  return { created, skipped: input.phones.length - created };
}

export async function reassignClients(input: { clientCodes: string[]; toUserId: number; assignedByUserId: number }) {
  const dataSource = await getDataSource();

  const count = await dataSource.transaction(async (manager) => {
    const clients = await manager.getRepository(Client).find({ where: input.clientCodes.map((code) => ({ code })) });

    for (const client of clients) {
      await manager.getRepository(ClientAssignment).save(
        manager.getRepository(ClientAssignment).create({
          clientId: client.id,
          userId: input.toUserId,
          assignedByUserId: input.assignedByUserId,
        }),
      );
      client.currentAssignedUserId = input.toUserId;
      await manager.getRepository(Client).save(client);
    }

    return clients.length;
  });

  if (count > 0) {
    try {
      const { notify } = await import("@/services/notifications.service");
      await notify([input.toUserId], "assignment", { title: "New leads assigned to you", body: `${count} lead${count === 1 ? "" : "s"} ${count === 1 ? "was" : "were"} just assigned to you.`, url: "/leads" });
    } catch (error) {
      console.error("Assignment notification failed", error);
    }
  }

  return count;
}

async function nextClientCode(dataSource: Awaited<ReturnType<typeof getDataSource>>) {
  const result = await dataSource.query(`SELECT nextval('client_code_seq') AS next`);
  return `CL-${String(result[0].next).padStart(4, "0")}`;
}

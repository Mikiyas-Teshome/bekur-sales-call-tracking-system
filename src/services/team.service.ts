import "server-only";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { getDataSource } from "@/db/data-source";
import { Call, Client, User } from "@/entities";
import { resolveRoleId } from "@/services/roles.service";

export async function listTeamMembers() {
  const dataSource = await getDataSource();
  const users = await dataSource.getRepository(User).find({ relations: { role: true }, order: { createdAt: "ASC" } });

  const [callCounts, revenueRows] = await Promise.all([
    dataSource.getRepository(Call).createQueryBuilder("call").select("call.loggedByUserId", "userId").addSelect("COUNT(*)", "count").where("call.deletedAt IS NULL").groupBy("call.loggedByUserId").getRawMany<{ userId: number; count: string }>(),
    dataSource
      .getRepository(Call)
      .createQueryBuilder("call")
      .select("call.loggedByUserId", "userId")
      .addSelect("COALESCE(SUM(call.dealValue), 0)", "revenue")
      .where("call.pipelineStageAfter = 'Closed Won'")
      .andWhere("call.deletedAt IS NULL")
      .groupBy("call.loggedByUserId")
      .getRawMany<{ userId: number; revenue: string }>(),
  ]);

  const leadCounts = await dataSource.getRepository(Client).createQueryBuilder("client").select("client.currentAssignedUserId", "userId").addSelect("COUNT(*)", "count").where("client.currentAssignedUserId IS NOT NULL").groupBy("client.currentAssignedUserId").getRawMany<{ userId: number; count: string }>();

  const callsByUser = new Map(callCounts.map((row) => [row.userId, Number(row.count)]));
  const revenueByUser = new Map(revenueRows.map((row) => [row.userId, Number(row.revenue)]));
  const leadsByUser = new Map(leadCounts.map((row) => [row.userId, Number(row.count)]));

  return users.map((user) => ({
    id: user.code,
    initials: user.fullName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase(),
    name: user.fullName,
    email: user.email,
    role: user.role.name,
    roleCode: user.role.code,
    status: (user.active ? "Active" : "Invited") as "Active" | "Invited" | "Inactive",
    leads: leadsByUser.get(user.id) ?? 0,
    calls: callsByUser.get(user.id) ?? 0,
    conversion: "—",
    revenue: `$${(revenueByUser.get(user.id) ?? 0).toLocaleString()}`,
    lastActive: user.active ? "Active" : "Invite sent",
  }));
}

export async function resolveUserId(code: string) {
  const dataSource = await getDataSource();
  const user = await dataSource.getRepository(User).findOne({ where: { code }, select: { id: true } });
  return user?.id ?? null;
}

export async function inviteTeamMember(input: { fullName: string; email: string; roleCode: string }) {
  const dataSource = await getDataSource();
  const repo = dataSource.getRepository(User);

  const existing = await repo.findOne({ where: { email: input.email.toLowerCase() } });
  if (existing) throw new Error("A teammate with this email already exists.");

  const roleId = await resolveRoleId(input.roleCode);
  if (!roleId) throw new Error("Role not found.");

  const unusablePassword = crypto.randomBytes(32).toString("hex");
  return repo.save(
    repo.create({
      code: `USR-${Date.now().toString(36).toUpperCase()}`,
      email: input.email.toLowerCase(),
      passwordHash: await bcrypt.hash(unusablePassword, 12),
      fullName: input.fullName,
      roleId,
      active: false,
    }),
  );
}

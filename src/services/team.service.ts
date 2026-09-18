import "server-only";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { getDataSource } from "@/db/data-source";
import { AuthToken, AuthTokenType, Call, Client, User } from "@/entities";
import { getRole, resolveRoleId } from "@/services/roles.service";
import { createAuthToken } from "@/lib/auth-tokens";
import { sendEmail } from "@/lib/resend";
import { InviteTeammateEmail } from "@/emails/invite-teammate.email";

const INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function listTeamMembers() {
  const dataSource = await getDataSource();
  const users = await dataSource.getRepository(User).find({ relations: { role: true }, order: { createdAt: "ASC" } });

  const [callCounts, revenueRows, activatedRows] = await Promise.all([
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
    dataSource
      .getRepository(AuthToken)
      .createQueryBuilder("token")
      .select("DISTINCT token.userId", "userId")
      .where("token.type = :type", { type: AuthTokenType.INVITE })
      .andWhere("token.consumedAt IS NOT NULL")
      .getRawMany<{ userId: number }>(),
  ]);

  const leadCounts = await dataSource.getRepository(Client).createQueryBuilder("client").select("client.currentAssignedUserId", "userId").addSelect("COUNT(*)", "count").where("client.currentAssignedUserId IS NOT NULL").groupBy("client.currentAssignedUserId").getRawMany<{ userId: number; count: string }>();

  const callsByUser = new Map(callCounts.map((row) => [row.userId, Number(row.count)]));
  const revenueByUser = new Map(revenueRows.map((row) => [row.userId, Number(row.revenue)]));
  const leadsByUser = new Map(leadCounts.map((row) => [row.userId, Number(row.count)]));
  const activatedUserIds = new Set(activatedRows.map((row) => row.userId));

  return users.map((user) => {
    const hasActivated = activatedUserIds.has(user.id);
    const status: "Active" | "Invited" | "Inactive" = user.active ? "Active" : hasActivated ? "Inactive" : "Invited";

    return {
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
      status,
      leads: leadsByUser.get(user.id) ?? 0,
      calls: callsByUser.get(user.id) ?? 0,
      conversion: "—",
      revenue: `$${(revenueByUser.get(user.id) ?? 0).toLocaleString()}`,
      lastActive: status === "Active" ? "Active" : status === "Inactive" ? "Deactivated" : "Invite sent",
    };
  });
}

export async function resolveUserId(code: string) {
  const dataSource = await getDataSource();
  const user = await dataSource.getRepository(User).findOne({ where: { code }, select: { id: true } });
  return user?.id ?? null;
}

export async function setTeamMemberActive(userId: number, active: boolean) {
  const dataSource = await getDataSource();
  const userRepo = dataSource.getRepository(User);
  const user = await userRepo.findOneOrFail({ where: { id: userId }, relations: { role: { permissions: true } } });

  if (!active) {
    const hasRolesManage = user.role.permissions.some((permission) => permission.key === "roles:manage");
    if (hasRolesManage) {
      const { listUserIdsWithPermission } = await import("@/services/roles.service");
      const activeAdminIds = await listUserIdsWithPermission("roles:manage");
      if (activeAdminIds.filter((id) => id !== userId).length === 0) throw new Error("This is the last active teammate who can manage roles — promote someone else first.");
    }
  }

  user.active = active;
  return userRepo.save(user);
}

export async function inviteTeamMember(input: { fullName: string; email: string; roleCode: string; invitedByName: string }) {
  const dataSource = await getDataSource();
  const repo = dataSource.getRepository(User);

  const existing = await repo.findOne({ where: { email: input.email.toLowerCase() } });
  if (existing) throw new Error("A teammate with this email already exists.");

  const roleId = await resolveRoleId(input.roleCode);
  if (!roleId) throw new Error("Role not found.");
  const role = await getRole(roleId);

  const unusablePassword = crypto.randomBytes(32).toString("hex");
  const user = await repo.save(
    repo.create({
      code: `USR-${Date.now().toString(36).toUpperCase()}`,
      email: input.email.toLowerCase(),
      passwordHash: await bcrypt.hash(unusablePassword, 12),
      fullName: input.fullName,
      roleId,
      active: false,
    }),
  );

  const rawToken = await createAuthToken(user.id, AuthTokenType.INVITE, INVITE_TOKEN_TTL_MS);
  const activateUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/activate?token=${rawToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: `${input.invitedByName} invited you to join Bekur`,
      react: InviteTeammateEmail({ fullName: user.fullName, inviterName: input.invitedByName, roleName: role.name, activateUrl }),
    });
    return { user, emailSent: true as const };
  } catch (error) {
    return { user, emailSent: false as const, emailError: error instanceof Error ? error.message : "Could not send the invite email." };
  }
}

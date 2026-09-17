import "server-only";
import bcrypt from "bcryptjs";
import { getDataSource } from "@/db/data-source";
import { User } from "@/entities";

export async function getProfile(userId: number) {
  const dataSource = await getDataSource();
  const user = await dataSource.getRepository(User).findOneOrFail({ where: { id: userId }, relations: { role: true } });

  return { fullName: user.fullName, email: user.email, phone: user.phone, role: user.role.name, code: user.code };
}

export async function updateProfile(userId: number, input: { fullName: string; email: string; phone: string | null }) {
  const dataSource = await getDataSource();
  const repo = dataSource.getRepository(User);

  const email = input.email.trim().toLowerCase();
  const existing = await repo.findOne({ where: { email } });
  if (existing && existing.id !== userId) throw new Error("Another account already uses this email.");

  const user = await repo.findOneOrFail({ where: { id: userId } });
  user.fullName = input.fullName;
  user.email = email;
  user.phone = input.phone;
  return repo.save(user);
}

export async function changePassword(userId: number, input: { currentPassword: string; newPassword: string }) {
  const dataSource = await getDataSource();
  const repo = dataSource.getRepository(User);
  const user = await repo.findOneOrFail({ where: { id: userId } });

  const matches = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!matches) throw new Error("Current password is incorrect.");

  user.passwordHash = await bcrypt.hash(input.newPassword, 12);
  return repo.save(user);
}

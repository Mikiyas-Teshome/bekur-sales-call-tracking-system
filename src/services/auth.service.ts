import "server-only";
import bcrypt from "bcryptjs";
import { getDataSource } from "@/db/data-source";
import { User } from "@/entities";

export async function setUserPassword(userId: number, newPassword: string) {
  const dataSource = await getDataSource();
  const repo = dataSource.getRepository(User);
  const user = await repo.findOneOrFail({ where: { id: userId } });
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.active = true;
  return repo.save(user);
}

export async function findUserByEmail(email: string) {
  const dataSource = await getDataSource();
  return dataSource.getRepository(User).findOne({ where: { email: email.trim().toLowerCase() } });
}

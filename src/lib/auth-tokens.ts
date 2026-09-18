import "server-only";
import crypto from "node:crypto";
import { getDataSource } from "@/db/data-source";
import { AuthToken, AuthTokenType } from "@/entities";

function hashToken(rawToken: string) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export async function createAuthToken(userId: number, type: AuthTokenType, ttlMs: number) {
  const dataSource = await getDataSource();
  const repo = dataSource.getRepository(AuthToken);

  const rawToken = crypto.randomBytes(32).toString("hex");
  await repo.save(
    repo.create({
      userId,
      type,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + ttlMs),
    }),
  );

  return rawToken;
}

export async function peekAuthToken(rawToken: string, type: AuthTokenType) {
  const dataSource = await getDataSource();
  const repo = dataSource.getRepository(AuthToken);

  const token = await repo.findOne({ where: { tokenHash: hashToken(rawToken), type }, relations: { user: { role: true } } });
  if (!token || token.consumedAt || token.expiresAt.getTime() < Date.now()) return null;

  return { userId: token.userId, fullName: token.user.fullName, email: token.user.email, roleName: token.user.role.name };
}

export async function consumeAuthToken(rawToken: string, type: AuthTokenType) {
  const dataSource = await getDataSource();
  const repo = dataSource.getRepository(AuthToken);

  const token = await repo.findOne({ where: { tokenHash: hashToken(rawToken), type } });
  if (!token) return null;
  if (token.consumedAt) return null;
  if (token.expiresAt.getTime() < Date.now()) return null;

  token.consumedAt = new Date();
  await repo.save(token);

  return token.userId;
}

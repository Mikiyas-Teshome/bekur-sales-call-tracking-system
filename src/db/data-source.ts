import "reflect-metadata";
import "pg";
import { DataSource } from "typeorm";
import { AuditLog, AuthToken, Call, Campaign, Client, ClientAssignment, DeviceToken, NotificationPreference, Permission, Project, Role, User } from "../entities";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

export const AppDataSource = new DataSource({
  type: "postgres",
  url: requireEnv("DATABASE_URL_POOLED"),
  ssl: { rejectUnauthorized: false },
  entities: [User, Role, Permission, Project, Campaign, Client, ClientAssignment, Call, AuditLog, AuthToken, DeviceToken, NotificationPreference],
  synchronize: false,
  logging: false,
});

let initialization: Promise<DataSource> | null = null;

export function getDataSource() {
  if (AppDataSource.isInitialized) return Promise.resolve(AppDataSource);
  if (!initialization) initialization = AppDataSource.initialize();
  return initialization;
}

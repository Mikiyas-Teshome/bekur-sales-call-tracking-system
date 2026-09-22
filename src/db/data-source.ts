import "reflect-metadata";
import "pg";
import { DataSource } from "typeorm";
import { AuditLog, AuthToken, Call, Campaign, Client, ClientAssignment, DeviceToken, KpiTarget, NotificationPreference, Permission, Project, Role, User, UserNotification } from "../entities";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

function normalizeConnectionUrl(value: string) {
  if (!value) return value;

  try {
    const parsed = new URL(value);
    const params = new URLSearchParams(parsed.search);
    for (const key of ["sslmode", "channel_binding"]) {
      params.delete(key);
    }
    parsed.search = params.toString();
    return parsed.toString();
  } catch {
    return value.replace(/[?&](sslmode|channel_binding)=[^&]+/g, "");
  }
}

const connectionUrl = normalizeConnectionUrl(requireEnv("DATABASE_URL_POOLED"));
const isLocalConnection = /localhost|127\.0\.0\.1/.test(connectionUrl);

export const AppDataSource = new DataSource({
  type: "postgres",
  url: connectionUrl,
  ssl: isLocalConnection ? false : { rejectUnauthorized: false },
  entities: [User, Role, Permission, Project, Campaign, Client, ClientAssignment, Call, AuditLog, AuthToken, DeviceToken, NotificationPreference, UserNotification, KpiTarget],
  synchronize: false,
  logging: false,
});

let initialization: Promise<DataSource> | null = null;

export function getDataSource() {
  if (AppDataSource.isInitialized) return Promise.resolve(AppDataSource);
  if (!initialization) initialization = AppDataSource.initialize();
  return initialization;
}

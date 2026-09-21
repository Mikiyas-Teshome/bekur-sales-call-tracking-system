import "dotenv/config";
import "reflect-metadata";
import { DataSource } from "typeorm";
import { AuditLog, AuthToken, Call, Campaign, Client, ClientAssignment, DeviceToken, NotificationPreference, Permission, Project, Role, User, UserNotification } from "../entities";

function normalizeConnectionUrl(value?: string) {
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

const migrationUrl = normalizeConnectionUrl(process.env.DATABASE_URL);
const isLocalConnection = /localhost|127\.0\.0\.1/.test(migrationUrl ?? "");

const migrationDataSource = new DataSource({
  type: "postgres",
  url: migrationUrl,
  ssl: isLocalConnection ? false : { rejectUnauthorized: false },
  entities: [User, Role, Permission, Project, Campaign, Client, ClientAssignment, Call, AuditLog, AuthToken, DeviceToken, NotificationPreference, UserNotification],
  migrations: ["src/db/migrations/*.ts"],
  synchronize: false,
});

export default migrationDataSource;

import "dotenv/config";
import "reflect-metadata";
import { DataSource } from "typeorm";
import { AuditLog, AuthToken, Call, Campaign, Client, ClientAssignment, DeviceToken, NotificationPreference, Permission, Project, Role, User } from "../entities";

const migrationUrl = process.env.DATABASE_URL;
const isLocalConnection = /localhost|127\.0\.0\.1/.test(migrationUrl ?? "");

const migrationDataSource = new DataSource({
  type: "postgres",
  url: migrationUrl,
  ssl: isLocalConnection ? false : { rejectUnauthorized: false },
  entities: [User, Role, Permission, Project, Campaign, Client, ClientAssignment, Call, AuditLog, AuthToken, DeviceToken, NotificationPreference],
  migrations: ["src/db/migrations/*.ts"],
  synchronize: false,
});

export default migrationDataSource;

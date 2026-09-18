import "dotenv/config";
import "reflect-metadata";
import { DataSource } from "typeorm";
import { AuditLog, AuthToken, Call, Campaign, Client, ClientAssignment, DeviceToken, NotificationPreference, Permission, Project, Role, User } from "../entities";

const migrationDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  entities: [User, Role, Permission, Project, Campaign, Client, ClientAssignment, Call, AuditLog, AuthToken, DeviceToken, NotificationPreference],
  migrations: ["src/db/migrations/*.ts"],
  synchronize: false,
});

export default migrationDataSource;

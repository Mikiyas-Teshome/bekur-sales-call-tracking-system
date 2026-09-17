import "dotenv/config";
import "reflect-metadata";
import { DataSource } from "typeorm";
import { AuditLog, Call, Campaign, Client, ClientAssignment, Permission, Project, Role, User } from "../entities";

const migrationDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  entities: [User, Role, Permission, Project, Campaign, Client, ClientAssignment, Call, AuditLog],
  migrations: ["src/db/migrations/*.ts"],
  synchronize: false,
});

export default migrationDataSource;

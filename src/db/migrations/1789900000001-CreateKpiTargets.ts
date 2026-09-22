import { MigrationInterface, QueryRunner } from "typeorm";

const permission = { key: "kpi:manage_targets", resource: "kpi", action: "manage_targets", label: "Set monthly KPI targets", group: "Reports" };
const roleCodes = ["administrator", "sales-manager"];

export class CreateKpiTargets1789900000001 implements MigrationInterface {
  name = "CreateKpiTargets1789900000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "kpi_targets" (
        "id" SERIAL NOT NULL,
        "userId" integer NOT NULL,
        "period" character varying(7) NOT NULL,
        "callsTarget" integer NOT NULL DEFAULT 0,
        "contactsTarget" integer NOT NULL DEFAULT 0,
        "demosTarget" integer NOT NULL DEFAULT 0,
        "dealsWonTarget" integer NOT NULL DEFAULT 0,
        "revenueTarget" numeric(12,2) NOT NULL DEFAULT 0,
        "setByUserId" integer,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_kpi_targets" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_kpi_targets_user_period" ON "kpi_targets" ("userId", "period")`);
    await queryRunner.query(`ALTER TABLE "kpi_targets" ADD CONSTRAINT "FK_kpi_targets_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "kpi_targets" ADD CONSTRAINT "FK_kpi_targets_set_by" FOREIGN KEY ("setByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);

    await queryRunner.query(`INSERT INTO "permissions" ("key", "resource", "action", "label", "group") VALUES ($1, $2, $3, $4, $5) ON CONFLICT ("key") DO NOTHING`, [permission.key, permission.resource, permission.action, permission.label, permission.group]);
    for (const roleCode of roleCodes) {
      await queryRunner.query(
        `INSERT INTO "role_permissions" ("roleId", "permissionId")
         SELECT r.id, p.id FROM "roles" r, "permissions" p WHERE r.code = $1 AND p.key = $2
         ON CONFLICT DO NOTHING`,
        [roleCode, permission.key],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "role_permissions" WHERE "permissionId" IN (SELECT id FROM "permissions" WHERE key = $1)`, [permission.key]);
    await queryRunner.query(`DELETE FROM "permissions" WHERE key = $1`, [permission.key]);
    await queryRunner.query(`ALTER TABLE "kpi_targets" DROP CONSTRAINT "FK_kpi_targets_set_by"`);
    await queryRunner.query(`ALTER TABLE "kpi_targets" DROP CONSTRAINT "FK_kpi_targets_user"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_kpi_targets_user_period"`);
    await queryRunner.query(`DROP TABLE "kpi_targets"`);
  }
}

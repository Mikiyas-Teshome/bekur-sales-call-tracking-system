import { MigrationInterface, QueryRunner } from "typeorm";
import { permissionCatalog, administratorPermissionKeys, salesManagerPermissionKeys, salesRepPermissionKeys } from "../../lib/permissions";

const roleDefinitions = [
  { code: "administrator", name: "Administrator", description: "Full access to every feature.", isSystem: true, permissionKeys: administratorPermissionKeys },
  { code: "sales-manager", name: "Sales Manager", description: "Manages projects, campaigns, leads, and team performance.", isSystem: false, permissionKeys: salesManagerPermissionKeys },
  { code: "sales-rep", name: "Sales Rep", description: "Works assigned leads and logs calls.", isSystem: false, permissionKeys: salesRepPermissionKeys },
];

export class SeedRolesAndPermissions1789700000001 implements MigrationInterface {
  name = "SeedRolesAndPermissions1789700000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const permission of permissionCatalog) {
      await queryRunner.query(`INSERT INTO "permissions" ("key", "resource", "action", "label", "group") VALUES ($1, $2, $3, $4, $5) ON CONFLICT ("key") DO NOTHING`, [permission.key, permission.resource, permission.action, permission.label, permission.group]);
    }

    for (const role of roleDefinitions) {
      await queryRunner.query(`INSERT INTO "roles" ("code", "name", "description", "isSystem") VALUES ($1, $2, $3, $4) ON CONFLICT ("code") DO NOTHING`, [role.code, role.name, role.description, role.isSystem]);

      for (const key of role.permissionKeys) {
        await queryRunner.query(
          `INSERT INTO "role_permissions" ("roleId", "permissionId")
           SELECT r.id, p.id FROM "roles" r, "permissions" p WHERE r.code = $1 AND p.key = $2
           ON CONFLICT DO NOTHING`,
          [role.code, key],
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const role of roleDefinitions) {
      await queryRunner.query(`DELETE FROM "role_permissions" WHERE "roleId" IN (SELECT id FROM "roles" WHERE code = $1)`, [role.code]);
      await queryRunner.query(`DELETE FROM "roles" WHERE code = $1`, [role.code]);
    }
    for (const permission of permissionCatalog) {
      await queryRunner.query(`DELETE FROM "permissions" WHERE key = $1`, [permission.key]);
    }
  }
}

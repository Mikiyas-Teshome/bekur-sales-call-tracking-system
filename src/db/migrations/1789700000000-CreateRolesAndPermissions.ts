import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRolesAndPermissions1789700000000 implements MigrationInterface {
  name = "CreateRolesAndPermissions1789700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "permissions" ("id" SERIAL NOT NULL, "key" character varying NOT NULL, "resource" character varying NOT NULL, "action" character varying NOT NULL, "label" character varying NOT NULL, "group" character varying NOT NULL, "description" character varying, CONSTRAINT "UQ_permissions_key" UNIQUE ("key"), CONSTRAINT "PK_permissions_id" PRIMARY KEY ("id"))`);

    await queryRunner.query(`CREATE TABLE "roles" ("id" SERIAL NOT NULL, "code" character varying NOT NULL, "name" character varying NOT NULL, "description" character varying, "isSystem" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_roles_code" UNIQUE ("code"), CONSTRAINT "UQ_roles_name" UNIQUE ("name"), CONSTRAINT "PK_roles_id" PRIMARY KEY ("id"))`);

    await queryRunner.query(`CREATE TABLE "role_permissions" ("roleId" integer NOT NULL, "permissionId" integer NOT NULL, CONSTRAINT "PK_role_permissions" PRIMARY KEY ("roleId", "permissionId"))`);
    await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_role_permissions_role" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_role_permissions_permission" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_role_permissions_permission"`);
    await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_role_permissions_role"`);
    await queryRunner.query(`DROP TABLE "role_permissions"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP TABLE "permissions"`);
  }
}

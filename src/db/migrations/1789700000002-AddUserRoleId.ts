import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserRoleId1789700000002 implements MigrationInterface {
  name = "AddUserRoleId1789700000002";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "roleId" integer`);
    await queryRunner.query(`UPDATE "users" SET "roleId" = "roles"."id" FROM "roles" WHERE "roles"."name" = "users"."role"::text`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "roleId" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_users_role" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_role"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "roleId"`);
  }
}

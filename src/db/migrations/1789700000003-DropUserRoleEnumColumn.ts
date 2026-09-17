import { MigrationInterface, QueryRunner } from "typeorm";

export class DropUserRoleEnumColumn1789700000003 implements MigrationInterface {
  name = "DropUserRoleEnumColumn1789700000003";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('Administrator', 'Sales Manager', 'Sales Rep')`);
    await queryRunner.query(`ALTER TABLE "users" ADD "role" "public"."users_role_enum" NOT NULL DEFAULT 'Sales Rep'`);
  }
}

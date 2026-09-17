import { MigrationInterface, QueryRunner } from "typeorm";

export class ClientCodeSequence1789593400000 implements MigrationInterface {
  name = "ClientCodeSequence1789593400000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS client_code_seq START WITH 200`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP SEQUENCE IF EXISTS client_code_seq`);
  }
}

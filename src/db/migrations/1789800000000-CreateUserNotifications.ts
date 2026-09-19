import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserNotifications1789800000000 implements MigrationInterface {
  name = "CreateUserNotifications1789800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_notifications" (
        "id" SERIAL NOT NULL,
        "userId" integer NOT NULL,
        "category" character varying NOT NULL,
        "title" character varying NOT NULL,
        "body" text NOT NULL,
        "url" character varying,
        "isRead" boolean NOT NULL DEFAULT false,
        "readAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_notifications" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_user_notifications_user_created_at" ON "user_notifications" ("userId", "createdAt" DESC)`);
    await queryRunner.query(`CREATE INDEX "IDX_user_notifications_user_is_read" ON "user_notifications" ("userId", "isRead")`);
    await queryRunner.query(`ALTER TABLE "user_notifications" ADD CONSTRAINT "FK_user_notifications_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_notifications" DROP CONSTRAINT "FK_user_notifications_user"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_user_notifications_user_is_read"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_user_notifications_user_created_at"`);
    await queryRunner.query(`DROP TABLE "user_notifications"`);
  }
}

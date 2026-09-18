import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAuthDeviceNotifications1789650459939 implements MigrationInterface {
    name = 'CreateAuthDeviceNotifications1789650459939'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."auth_tokens_type_enum" AS ENUM('invite', 'password_reset')`);
        await queryRunner.query(`CREATE TABLE "auth_tokens" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "tokenHash" character varying NOT NULL, "type" "public"."auth_tokens_type_enum" NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "consumedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_323c4ca6708c6a8b81af2b4ee06" UNIQUE ("tokenHash"), CONSTRAINT "PK_41e9ddfbb32da18c4e85e45c2fd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "device_tokens" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "token" character varying NOT NULL, "platform" character varying NOT NULL DEFAULT 'web', "userAgent" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "lastSeenAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_977e24c520c49436d08e5eeea8a" UNIQUE ("token"), CONSTRAINT "PK_84700be257607cfb1f9dc2e52c3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "notification_preferences" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "category" character varying NOT NULL, "channelPush" boolean NOT NULL, "channelEmail" boolean NOT NULL, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e94e2b543f2f218ee68e4f4fad2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_90d452c90494da1080c16b52c1" ON "notification_preferences"  ("userId", "category") `);
        await queryRunner.query(`ALTER TABLE "auth_tokens" ADD CONSTRAINT "FK_c25fb956ebada4b256501585cca" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "device_tokens" ADD CONSTRAINT "FK_511957e3e8443429dc3fb00120c" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD CONSTRAINT "FK_b70c44e8b00757584a393225593" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP CONSTRAINT "FK_b70c44e8b00757584a393225593"`);
        await queryRunner.query(`ALTER TABLE "device_tokens" DROP CONSTRAINT "FK_511957e3e8443429dc3fb00120c"`);
        await queryRunner.query(`ALTER TABLE "auth_tokens" DROP CONSTRAINT "FK_c25fb956ebada4b256501585cca"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_90d452c90494da1080c16b52c1"`);
        await queryRunner.query(`DROP TABLE "notification_preferences"`);
        await queryRunner.query(`DROP TABLE "device_tokens"`);
        await queryRunner.query(`DROP TABLE "auth_tokens"`);
        await queryRunner.query(`DROP TYPE "public"."auth_tokens_type_enum"`);
    }

}

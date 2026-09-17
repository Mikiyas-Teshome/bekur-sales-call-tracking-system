import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1789593326619 implements MigrationInterface {
    name = 'InitialSchema1789593326619'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."projects_status_enum" AS ENUM('Active', 'Planning', 'Archived')`);
        await queryRunner.query(`CREATE TABLE "projects" ("id" SERIAL NOT NULL, "code" character varying NOT NULL, "name" character varying NOT NULL, "description" text, "status" "public"."projects_status_enum" NOT NULL DEFAULT 'Planning', "startDate" date, "endDate" date, "revenueTarget" numeric(12,2), "ownerName" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_d95a87318392465ab663a32cc4f" UNIQUE ("code"), CONSTRAINT "PK_6271df0a7aed1d6c0691ce6ac50" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."campaigns_platform_enum" AS ENUM('Facebook', 'Instagram', 'Referral', 'Organic')`);
        await queryRunner.query(`CREATE TYPE "public"."campaigns_status_enum" AS ENUM('Active', 'Paused', 'Ended')`);
        await queryRunner.query(`CREATE TABLE "campaigns" ("id" SERIAL NOT NULL, "code" character varying NOT NULL, "name" character varying NOT NULL, "projectId" integer NOT NULL, "platform" "public"."campaigns_platform_enum" NOT NULL, "status" "public"."campaigns_status_enum" NOT NULL DEFAULT 'Active', "startDate" date, "adSpend" numeric(12,2) NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_91862d892c3bcd5b9b61d5f2b8d" UNIQUE ("code"), CONSTRAINT "PK_831e3fcd4fc45b4e4c3f57a9ee4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "client_assignments" ("id" SERIAL NOT NULL, "clientId" integer NOT NULL, "userId" integer, "assignedByUserId" integer NOT NULL, "assignedAt" TIMESTAMP NOT NULL DEFAULT now(), "unassignedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_3af234a4835d985328980066e6a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."clients_pipelinestage_enum" AS ENUM('New Lead', 'Attempted Contact', 'Qualified', 'Demo Scheduled', 'Proposal Sent', 'Closed Won', 'Closed Lost')`);
        await queryRunner.query(`CREATE TABLE "clients" ("id" SERIAL NOT NULL, "code" character varying NOT NULL, "displayName" character varying NOT NULL, "phone" character varying NOT NULL, "phoneNormalized" character varying NOT NULL, "businessName" character varying, "email" character varying, "campaignId" integer NOT NULL, "currentAssignedUserId" integer, "firstContactDate" date, "pipelineStage" "public"."clients_pipelinestage_enum" NOT NULL DEFAULT 'New Lead', "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_5b84bb456aa7fc9241c5d8277d0" UNIQUE ("code"), CONSTRAINT "PK_f1ab7cf3a5714dbc6bb4e1c28a4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_87b27301d4294304c1c86bf5e7" ON "clients"  ("phoneNormalized") `);
        await queryRunner.query(`CREATE TYPE "public"."calls_outcome_enum" AS ENUM('Answered - Interested', 'Answered - Requested Demo', 'Callback Requested', 'No Answer', 'Follow-up Scheduled', 'Converted / Sale')`);
        await queryRunner.query(`CREATE TYPE "public"."calls_pipelinestageafter_enum" AS ENUM('New Lead', 'Attempted Contact', 'Qualified', 'Demo Scheduled', 'Proposal Sent', 'Closed Won', 'Closed Lost')`);
        await queryRunner.query(`CREATE TABLE "calls" ("id" SERIAL NOT NULL, "clientId" integer NOT NULL, "loggedByUserId" integer NOT NULL, "campaignId" integer NOT NULL, "projectId" integer NOT NULL, "calledAt" TIMESTAMP WITH TIME ZONE NOT NULL, "outcome" "public"."calls_outcome_enum" NOT NULL, "outcomeNote" text, "pipelineStageAfter" "public"."calls_pipelinestageafter_enum" NOT NULL, "dealValue" numeric(12,2), "nextFollowUpDate" date, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_d9171d91f8dd1a649659f1b6a20" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('Administrator', 'Sales Manager', 'Sales Rep')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "code" character varying NOT NULL, "email" character varying NOT NULL, "passwordHash" character varying NOT NULL, "fullName" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'Sales Rep', "active" boolean NOT NULL DEFAULT true, "managerId" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_1f7a2b11e29b1422a2622beab36" UNIQUE ("code"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" SERIAL NOT NULL, "actorUserId" integer NOT NULL, "action" character varying NOT NULL, "resourceType" character varying NOT NULL, "resourceId" integer NOT NULL, "before" jsonb, "after" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "campaigns" ADD CONSTRAINT "FK_67eb52d32ceecf37ba86969b2f2" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "client_assignments" ADD CONSTRAINT "FK_be30f188a00e3877e1b6ed9f2bd" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "client_assignments" ADD CONSTRAINT "FK_bf97bc9f002c14bef79bb960b70" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "client_assignments" ADD CONSTRAINT "FK_2c21633ab35a71d90af18f8fbe0" FOREIGN KEY ("assignedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "clients" ADD CONSTRAINT "FK_ca6baaf4700270261bf4edd4d73" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "clients" ADD CONSTRAINT "FK_4f773f17ac15e40866267e7192b" FOREIGN KEY ("currentAssignedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "calls" ADD CONSTRAINT "FK_ea8886f10402457a9227cf43a58" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "calls" ADD CONSTRAINT "FK_79d25c518cd8e6afa920f864ac2" FOREIGN KEY ("loggedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "calls" ADD CONSTRAINT "FK_fa7572c103b6e75d43eb8fe0c22" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "calls" ADD CONSTRAINT "FK_2b0bf8c7a1fe558f86015450a1e" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "calls" DROP CONSTRAINT "FK_2b0bf8c7a1fe558f86015450a1e"`);
        await queryRunner.query(`ALTER TABLE "calls" DROP CONSTRAINT "FK_fa7572c103b6e75d43eb8fe0c22"`);
        await queryRunner.query(`ALTER TABLE "calls" DROP CONSTRAINT "FK_79d25c518cd8e6afa920f864ac2"`);
        await queryRunner.query(`ALTER TABLE "calls" DROP CONSTRAINT "FK_ea8886f10402457a9227cf43a58"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP CONSTRAINT "FK_4f773f17ac15e40866267e7192b"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP CONSTRAINT "FK_ca6baaf4700270261bf4edd4d73"`);
        await queryRunner.query(`ALTER TABLE "client_assignments" DROP CONSTRAINT "FK_2c21633ab35a71d90af18f8fbe0"`);
        await queryRunner.query(`ALTER TABLE "client_assignments" DROP CONSTRAINT "FK_bf97bc9f002c14bef79bb960b70"`);
        await queryRunner.query(`ALTER TABLE "client_assignments" DROP CONSTRAINT "FK_be30f188a00e3877e1b6ed9f2bd"`);
        await queryRunner.query(`ALTER TABLE "campaigns" DROP CONSTRAINT "FK_67eb52d32ceecf37ba86969b2f2"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "calls"`);
        await queryRunner.query(`DROP TYPE "public"."calls_pipelinestageafter_enum"`);
        await queryRunner.query(`DROP TYPE "public"."calls_outcome_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_87b27301d4294304c1c86bf5e7"`);
        await queryRunner.query(`DROP TABLE "clients"`);
        await queryRunner.query(`DROP TYPE "public"."clients_pipelinestage_enum"`);
        await queryRunner.query(`DROP TABLE "client_assignments"`);
        await queryRunner.query(`DROP TABLE "campaigns"`);
        await queryRunner.query(`DROP TYPE "public"."campaigns_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."campaigns_platform_enum"`);
        await queryRunner.query(`DROP TABLE "projects"`);
        await queryRunner.query(`DROP TYPE "public"."projects_status_enum"`);
    }

}

import { MigrationInterface, QueryRunner } from "typeorm";

// Keep in sync with PipelineStage / CallOutcome in src/entities/enums.ts.
const newPipelineStages = ["Contacted", "Nurturing", "Demo Completed", "Negotiation", "On Hold", "Unqualified", "Do Not Contact"];

const newCallOutcomes = [
  "Answered - Requested Info",
  "Answered - Not Interested",
  "Answered - Not Decision Maker",
  "Answered - Using Competitor",
  "Answered - Not Now",
  "Busy",
  "Voicemail Left",
  "Hung Up",
  "Wrong Number",
  "Number Unreachable",
  "Do Not Call",
];

export class ExpandPipelineAndOutcomeEnums1789900000000 implements MigrationInterface {
  name = "ExpandPipelineAndOutcomeEnums1789900000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const stage of newPipelineStages) {
      await queryRunner.query(`ALTER TYPE "public"."clients_pipelinestage_enum" ADD VALUE IF NOT EXISTS '${stage}'`);
      await queryRunner.query(`ALTER TYPE "public"."calls_pipelinestageafter_enum" ADD VALUE IF NOT EXISTS '${stage}'`);
    }
    for (const outcome of newCallOutcomes) {
      await queryRunner.query(`ALTER TYPE "public"."calls_outcome_enum" ADD VALUE IF NOT EXISTS '${outcome}'`);
    }
  }

  public async down(): Promise<void> {
    // Postgres cannot remove values from an enum type. Reverting would require rewriting every row
    // that uses one of the new values and recreating the types, so this migration is forward-only.
  }
}

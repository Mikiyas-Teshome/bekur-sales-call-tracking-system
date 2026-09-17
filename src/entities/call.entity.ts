import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { CallOutcome, PipelineStage } from "./enums";
import type { Client } from "./client.entity";
import type { Campaign } from "./campaign.entity";
import type { Project } from "./project.entity";
import type { User } from "./user.entity";

@Entity({ name: "calls" })
export class Call {
  @PrimaryGeneratedColumn() id: number;

  @Column({ type: "int" }) clientId: number;

  @ManyToOne("Client", (client: Client) => client.calls, { onDelete: "CASCADE" })
  @JoinColumn({ name: "clientId" })
  client: Client;

  @Column({ type: "int" }) loggedByUserId: number;

  @ManyToOne("User", (user: User) => user.calls, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "loggedByUserId" })
  loggedByUser: User;

  @Column({ type: "int" }) campaignId: number;

  @ManyToOne("Campaign", (campaign: Campaign) => campaign.calls, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "campaignId" })
  campaign: Campaign;

  @Column({ type: "int" }) projectId: number;

  @ManyToOne("Project", { onDelete: "RESTRICT" })
  @JoinColumn({ name: "projectId" })
  project: Project;

  @Column({ type: "timestamptz" }) calledAt: Date;

  @Column({ type: "enum", enum: CallOutcome }) outcome: CallOutcome;

  @Column({ type: "text", nullable: true }) outcomeNote: string | null;

  @Column({ type: "enum", enum: PipelineStage }) pipelineStageAfter: PipelineStage;

  @Column({ type: "decimal", precision: 12, scale: 2, nullable: true }) dealValue: string | null;

  @Column({ type: "date", nullable: true }) nextFollowUpDate: string | null;

  @CreateDateColumn() createdAt: Date;

  @UpdateDateColumn() updatedAt: Date;

  @DeleteDateColumn() deletedAt: Date | null;
}

Object.defineProperty(Call, "name", { value: "Call", configurable: true });

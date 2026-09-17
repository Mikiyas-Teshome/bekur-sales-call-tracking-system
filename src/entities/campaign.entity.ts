import { BeforeInsert, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { CampaignPlatform, CampaignStatus } from "./enums";
import type { Project } from "./project.entity";
import type { Client } from "./client.entity";
import type { Call } from "./call.entity";

@Entity({ name: "campaigns" })
export class Campaign {
  @PrimaryGeneratedColumn() id: number;

  @Column({ type: "varchar", unique: true }) code: string;

  @Column({ type: "varchar" }) name: string;

  @Column({ type: "int" }) projectId: number;

  @ManyToOne("Project", (project: Project) => project.campaigns, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "projectId" })
  project: Project;

  @Column({ type: "enum", enum: CampaignPlatform }) platform: CampaignPlatform;

  @Column({ type: "enum", enum: CampaignStatus, default: CampaignStatus.ACTIVE }) status: CampaignStatus;

  @Column({ type: "date", nullable: true }) startDate: string | null;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 }) adSpend: string;

  @OneToMany("Client", (client: Client) => client.campaign) clients: Client[];

  @OneToMany("Call", (call: Call) => call.campaign) calls: Call[];

  @CreateDateColumn() createdAt: Date;

  @UpdateDateColumn() updatedAt: Date;

  @BeforeInsert()
  async assignCode() {
    if (this.code) return;
    this.code = `CMP-${Date.now().toString(36).toUpperCase()}`;
  }
}

Object.defineProperty(Campaign, "name", { value: "Campaign", configurable: true });

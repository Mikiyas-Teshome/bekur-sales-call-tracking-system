import { BeforeInsert, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ProjectStatus } from "./enums";
import type { Campaign } from "./campaign.entity";

@Entity({ name: "projects" })
export class Project {
  @PrimaryGeneratedColumn() id: number;

  @Column({ type: "varchar", unique: true }) code: string;

  @Column({ type: "varchar" }) name: string;

  @Column({ type: "text", nullable: true }) description: string | null;

  @Column({ type: "enum", enum: ProjectStatus, default: ProjectStatus.PLANNING }) status: ProjectStatus;

  @Column({ type: "date", nullable: true }) startDate: string | null;

  @Column({ type: "date", nullable: true }) endDate: string | null;

  @Column({ type: "decimal", precision: 12, scale: 2, nullable: true }) revenueTarget: string | null;

  @Column({ type: "varchar", nullable: true }) ownerName: string | null;

  @OneToMany("Campaign", (campaign: Campaign) => campaign.project) campaigns: Campaign[];

  @CreateDateColumn() createdAt: Date;

  @UpdateDateColumn() updatedAt: Date;

  @BeforeInsert()
  async assignCode() {
    if (this.code) return;
    this.code = `PRJ-${Date.now().toString(36).toUpperCase()}`;
  }
}

Object.defineProperty(Project, "name", { value: "Project", configurable: true });

import { BeforeInsert, Column, CreateDateColumn, DeleteDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { PipelineStage } from "./enums";
import type { Campaign } from "./campaign.entity";
import type { User } from "./user.entity";
import type { Call } from "./call.entity";
import type { ClientAssignment } from "./client-assignment.entity";

@Entity({ name: "clients" })
@Index(["phoneNormalized"], { unique: true })
export class Client {
  @PrimaryGeneratedColumn() id: number;

  @Column({ type: "varchar", unique: true }) code: string;

  @Column({ type: "varchar" }) displayName: string;

  @Column({ type: "varchar" }) phone: string;

  @Column({ type: "varchar" }) phoneNormalized: string;

  @Column({ type: "varchar", nullable: true }) businessName: string | null;

  @Column({ type: "varchar", nullable: true }) email: string | null;

  @Column({ type: "int" }) campaignId: number;

  @ManyToOne("Campaign", (campaign: Campaign) => campaign.clients, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "campaignId" })
  campaign: Campaign;

  @Column({ type: "int", nullable: true }) currentAssignedUserId: number | null;

  @ManyToOne("User", { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "currentAssignedUserId" })
  currentAssignedUser: User | null;

  @Column({ type: "date", nullable: true }) firstContactDate: string | null;

  @Column({ type: "enum", enum: PipelineStage, default: PipelineStage.NEW_LEAD }) pipelineStage: PipelineStage;

  @Column({ type: "text", nullable: true }) notes: string | null;

  @OneToMany("Call", (call: Call) => call.client) calls: Call[];

  @OneToMany("ClientAssignment", (assignment: ClientAssignment) => assignment.client) assignmentHistory: ClientAssignment[];

  @CreateDateColumn() createdAt: Date;

  @UpdateDateColumn() updatedAt: Date;

  @DeleteDateColumn() deletedAt: Date | null;

  @BeforeInsert()
  normalizePhone() {
    this.phoneNormalized = this.phone.replace(/\D/g, "").replace(/^0/, "251");
  }
}

Object.defineProperty(Client, "name", { value: "Client", configurable: true });

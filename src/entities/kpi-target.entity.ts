import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import type { User } from "./user.entity";

@Entity({ name: "kpi_targets" })
@Index(["userId", "period"], { unique: true })
export class KpiTarget {
  @PrimaryGeneratedColumn() id: number;

  @Column({ type: "int" }) userId: number;

  @ManyToOne("User", { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column({ type: "varchar", length: 7 }) period: string;

  @Column({ type: "int", default: 0 }) callsTarget: number;

  @Column({ type: "int", default: 0 }) contactsTarget: number;

  @Column({ type: "int", default: 0 }) demosTarget: number;

  @Column({ type: "int", default: 0 }) dealsWonTarget: number;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 }) revenueTarget: string;

  @Column({ type: "int", nullable: true }) setByUserId: number | null;

  @ManyToOne("User", { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "setByUserId" })
  setByUser: User | null;

  @CreateDateColumn() createdAt: Date;

  @UpdateDateColumn() updatedAt: Date;
}

Object.defineProperty(KpiTarget, "name", { value: "KpiTarget", configurable: true });

import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "audit_logs" })
export class AuditLog {
  @PrimaryGeneratedColumn() id: number;

  @Column({ type: "int" }) actorUserId: number;

  @Column({ type: "varchar" }) action: string;

  @Column({ type: "varchar" }) resourceType: string;

  @Column({ type: "int" }) resourceId: number;

  @Column({ type: "jsonb", nullable: true }) before: Record<string, unknown> | null;

  @Column({ type: "jsonb", nullable: true }) after: Record<string, unknown> | null;

  @CreateDateColumn() createdAt: Date;
}

Object.defineProperty(AuditLog, "name", { value: "AuditLog", configurable: true });

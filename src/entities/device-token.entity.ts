import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import type { User } from "./user.entity";

@Entity({ name: "device_tokens" })
export class DeviceToken {
  @PrimaryGeneratedColumn() id: number;

  @Column({ type: "int" }) userId: number;

  @ManyToOne("User", { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column({ type: "varchar", unique: true }) token: string;

  @Column({ type: "varchar", default: "web" }) platform: string;

  @Column({ type: "varchar", nullable: true }) userAgent: string | null;

  @CreateDateColumn() createdAt: Date;

  @UpdateDateColumn() lastSeenAt: Date;
}

Object.defineProperty(DeviceToken, "name", { value: "DeviceToken", configurable: true });

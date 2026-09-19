import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import type { User } from "./user.entity";

@Entity({ name: "user_notifications" })
@Index(["userId", "createdAt"])
@Index(["userId", "isRead"])
export class UserNotification {
  @PrimaryGeneratedColumn() id: number;

  @Column({ type: "int" }) userId: number;

  @ManyToOne("User", { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column({ type: "varchar" }) category: string;

  @Column({ type: "varchar" }) title: string;

  @Column({ type: "text" }) body: string;

  @Column({ type: "varchar", nullable: true }) url: string | null;

  @Column({ type: "boolean", default: false }) isRead: boolean;

  @Column({ type: "timestamptz", nullable: true }) readAt: Date | null;

  @CreateDateColumn() createdAt: Date;

  @UpdateDateColumn() updatedAt: Date;
}

Object.defineProperty(UserNotification, "name", { value: "UserNotification", configurable: true });

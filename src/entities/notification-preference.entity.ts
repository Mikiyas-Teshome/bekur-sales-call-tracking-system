import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import type { User } from "./user.entity";

@Entity({ name: "notification_preferences" })
@Index(["userId", "category"], { unique: true })
export class NotificationPreference {
  @PrimaryGeneratedColumn() id: number;

  @Column({ type: "int" }) userId: number;

  @ManyToOne("User", { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column({ type: "varchar" }) category: string;

  @Column({ type: "boolean" }) channelPush: boolean;

  @Column({ type: "boolean" }) channelEmail: boolean;

  @UpdateDateColumn() updatedAt: Date;
}

Object.defineProperty(NotificationPreference, "name", { value: "NotificationPreference", configurable: true });

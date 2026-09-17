import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { AuthTokenType } from "./enums";
import type { User } from "./user.entity";

@Entity({ name: "auth_tokens" })
export class AuthToken {
  @PrimaryGeneratedColumn() id: number;

  @Column({ type: "int" }) userId: number;

  @ManyToOne("User", { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column({ type: "varchar", unique: true }) tokenHash: string;

  @Column({ type: "enum", enum: AuthTokenType }) type: AuthTokenType;

  @Column({ type: "timestamptz" }) expiresAt: Date;

  @Column({ type: "timestamptz", nullable: true }) consumedAt: Date | null;

  @CreateDateColumn() createdAt: Date;
}

Object.defineProperty(AuthToken, "name", { value: "AuthToken", configurable: true });

import { BeforeInsert, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import type { Call } from "./call.entity";
import type { ClientAssignment } from "./client-assignment.entity";
import type { Role } from "./role.entity";

@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn() id: number;

  @Column({ type: "varchar", unique: true }) code: string;

  @Column({ type: "varchar", unique: true }) email: string;

  @Column({ type: "varchar" }) passwordHash: string;

  @Column({ type: "varchar" }) fullName: string;

  @Column({ type: "varchar", nullable: true }) phone: string | null;

  @Column({ type: "int" }) roleId: number;

  @ManyToOne("Role", (role: Role) => role.users, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "roleId" })
  role: Role;

  @Column({ type: "boolean", default: true }) active: boolean;

  @Column({ type: "int", nullable: true }) managerId: number | null;

  @OneToMany("Call", (call: Call) => call.loggedByUser) calls: Call[];

  @OneToMany("ClientAssignment", (assignment: ClientAssignment) => assignment.user) assignments: ClientAssignment[];

  @CreateDateColumn() createdAt: Date;

  @UpdateDateColumn() updatedAt: Date;

  @BeforeInsert()
  async assignCode() {
    if (this.code) return;
    this.code = `USR-${Date.now().toString(36).toUpperCase()}`;
  }
}

Object.defineProperty(User, "name", { value: "User", configurable: true });

import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import type { Permission } from "./permission.entity";
import type { User } from "./user.entity";

@Entity({ name: "roles" })
export class Role {
  @PrimaryGeneratedColumn() id: number;

  @Column({ type: "varchar", unique: true }) code: string;

  @Column({ type: "varchar", unique: true }) name: string;

  @Column({ type: "varchar", nullable: true }) description: string | null;

  @Column({ type: "boolean", default: false }) isSystem: boolean;

  @ManyToMany("Permission")
  @JoinTable({ name: "role_permissions", joinColumn: { name: "roleId" }, inverseJoinColumn: { name: "permissionId" } })
  permissions: Permission[];

  @OneToMany("User", (user: User) => user.role) users: User[];

  @CreateDateColumn() createdAt: Date;

  @UpdateDateColumn() updatedAt: Date;
}

Object.defineProperty(Role, "name", { value: "Role", configurable: true });

import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import type { Client } from "./client.entity";
import type { User } from "./user.entity";

@Entity({ name: "client_assignments" })
export class ClientAssignment {
  @PrimaryGeneratedColumn() id: number;

  @Column({ type: "int" }) clientId: number;

  @ManyToOne("Client", (client: Client) => client.assignmentHistory, { onDelete: "CASCADE" })
  @JoinColumn({ name: "clientId" })
  client: Client;

  @Column({ type: "int", nullable: true }) userId: number | null;

  @ManyToOne("User", { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "userId" })
  user: User | null;

  @Column({ type: "int" }) assignedByUserId: number;

  @ManyToOne("User", { onDelete: "RESTRICT" })
  @JoinColumn({ name: "assignedByUserId" })
  assignedByUser: User;

  @CreateDateColumn() assignedAt: Date;

  @Column({ type: "timestamptz", nullable: true }) unassignedAt: Date | null;
}

Object.defineProperty(ClientAssignment, "name", { value: "ClientAssignment", configurable: true });

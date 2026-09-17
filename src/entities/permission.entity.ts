import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "permissions" })
export class Permission {
  @PrimaryGeneratedColumn() id: number;

  @Column({ type: "varchar", unique: true }) key: string;

  @Column({ type: "varchar" }) resource: string;

  @Column({ type: "varchar" }) action: string;

  @Column({ type: "varchar" }) label: string;

  @Column({ type: "varchar" }) group: string;

  @Column({ type: "varchar", nullable: true }) description: string | null;
}

Object.defineProperty(Permission, "name", { value: "Permission", configurable: true });

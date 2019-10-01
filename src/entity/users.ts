import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Users {

  @PrimaryGeneratedColumn("uuid")
  id: number;

  @Column({ type: "varchar" })
  account: string;

  @Column({ type: "varchar" })
  password: string;

  @Column({ type: "varchar" })
  role: string;

  @Column({ type: "varchar" })
  avatarUrl: string;

  @Column({ type: "timestamp" })
  createAt: Date;

  @Column({ type: "timestamp" })
  updateAt: Date;
}

import { Entity, Column, PrimaryGeneratedColumn, JoinColumn, ManyToOne } from "typeorm";
import { Users } from "./users";

@Entity()
export class UsersAudit {

  @PrimaryGeneratedColumn("uuid")
  id: number;

  @ManyToOne(type => Users, user => user.id)
  @JoinColumn()
  user: number;

  @Column({ type: "timestamp" })
  createAt: Date;
}

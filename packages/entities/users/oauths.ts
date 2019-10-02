import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Users } from "./users";

@Entity()
export class Oauths {

  @PrimaryGeneratedColumn("uuid")
  id: number;

  @ManyToOne(type => Users, user => user.id)
  @JoinColumn()
  userId: number;

  @Column({ type: "varchar" })
  oauthType: string

  @Column({ type: "varchar" })
  oauthId: string

  @Column({ type: "varchar" })
  unionId: string
}

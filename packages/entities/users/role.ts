import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn, CreateDateColumn } from "typeorm";

@Entity()
export class Roles {
  
  @PrimaryGeneratedColumn("uuid")
  id: number;
}
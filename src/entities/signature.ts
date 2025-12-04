import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";
import { Lecturer } from "./lecturer";

@Entity("signature")
export class Signature {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text", nullable: true })
  signature_data?: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  signature_url?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // *** Relationships ***
  @OneToOne(() => Lecturer, (lecturer) => lecturer.signature, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "lecturer_id" })
  lecturer!: Lecturer;
}

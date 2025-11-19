import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Pertanyaan } from "./pertanyaan";

@Entity("opsi_jawabans")
export class OpsiJawaban {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  pertanyaanId!: string;

  @Column({ length: 255 })
  text!: string;

  @Column({ type: "decimal", precision: 3, scale: 2 })
  nilai!: number;

  @Column({ type: "int" })
  urutan!: number;

  @ManyToOne(() => Pertanyaan, (pertanyaan) => pertanyaan.opsiJawabans, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "pertanyaanId" })
  pertanyaan!: Pertanyaan;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

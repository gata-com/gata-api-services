import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Penilaian } from "./penilaian";
import { Pertanyaan } from "./pertanyaan";
import { OpsiJawaban } from "./opsiJawaban";

@Entity("jawaban_penilaians")
export class JawabanPenilaian {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  penilaianId!: string;

  @Column({ type: "uuid" })
  pertanyaanId!: string;

  @Column({ type: "uuid" })
  opsiJawabanId!: string;

  @Column({ type: "decimal", precision: 3, scale: 2 })
  nilai!: number;

  @ManyToOne(() => Penilaian, (penilaian) => penilaian.jawabans, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "penilaianId" })
  penilaian!: Penilaian;

  @ManyToOne(() => Pertanyaan)
  @JoinColumn({ name: "pertanyaanId" })
  pertanyaan!: Pertanyaan;

  @ManyToOne(() => OpsiJawaban)
  @JoinColumn({ name: "opsiJawabanId" })
  opsiJawaban!: OpsiJawaban;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

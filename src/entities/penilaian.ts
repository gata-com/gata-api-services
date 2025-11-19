import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { DefenseSchedule } from "./defenseSchedule";
import { Lecturer } from "./lecturer";
import { Rubrik } from "./rubrik";
import { JawabanPenilaian } from "./jawabanPenilaian";

@Entity("penilaians")
export class Penilaian {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "int" })
  jadwalId!: number;

  @Column({ type: "int" })
  lecturerId!: number;

  @Column({ type: "uuid" })
  rubrikId!: string;

  @Column({ type: "text", nullable: true })
  catatan?: string;

  @Column({ type: "decimal", precision: 5, scale: 2, nullable: true })
  nilaiAkhir?: number;

  @Column({ type: "boolean", default: false })
  isFinalized!: boolean;

  @ManyToOne(() => DefenseSchedule, { onDelete: "CASCADE" })
  @JoinColumn({ name: "jadwalId" })
  jadwal!: DefenseSchedule;

  @ManyToOne(() => Lecturer, { onDelete: "CASCADE" })
  @JoinColumn({ name: "lecturerId" })
  lecturer!: Lecturer;

  @ManyToOne(() => Rubrik)
  @JoinColumn({ name: "rubrikId" })
  rubrik!: Rubrik;

  @OneToMany(() => JawabanPenilaian, (jawaban) => jawaban.penilaian, {
    cascade: true,
  })
  jawabans!: JawabanPenilaian[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

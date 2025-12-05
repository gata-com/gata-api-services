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
import { Student } from "./student";

@Entity("penilaians")
export class Penilaian {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "int" })
  jadwalId!: number;

  @Column({ type: "int" })
  lecturerId!: number;

  @Column({ type: "int", nullable: true })
  studentId?: number;

  @Column({ type: "uuid" })
  rubrikId!: string;

  @Column({ type: "text", nullable: true })
  catatan?: string;

  @Column({ type: "decimal", precision: 5, scale: 2, nullable: true })
  nilaiAkhir?: number;

  @Column({ type: "varchar", length: 5, nullable: true })
  nilaiHuruf?: string;

  @Column({ type: "boolean", default: false })
  isFinalized!: boolean;

  @Column({ type: "int", nullable: true })
  finalizedById?: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  finalizedByName?: string;

  @Column({ type: "datetime", nullable: true })
  finalizedAt?: Date;

  @ManyToOne(() => DefenseSchedule, { onDelete: "CASCADE" })
  @JoinColumn({ name: "jadwalId" })
  defense_schedule!: DefenseSchedule;

  @ManyToOne(() => Lecturer, { onDelete: "CASCADE" })
  @JoinColumn({ name: "lecturerId" })
  lecturer!: Lecturer;

  @ManyToOne(() => Student, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "studentId" })
  student?: Student;

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

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Student } from "./student";

@Entity("berita_acara_pdfs")
@Index(["student"])
export class BeritaAcaraPDF {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "int" })
  studentId!: number;

  @Column({ type: "varchar", length: 255 })
  pdfName!: string;

  @Column({ type: "text" })
  pdfUrl!: string;

  @Column({ type: "decimal", precision: 5, scale: 2 })
  nilaiAkhir!: number;

  @Column({ length: 5 })
  nilaiHuruf!: string;

  @Column({ type: "int" })
  jadwalId!: number;

  @Column({ type: "text", nullable: true })
  catatan?: string;

  @ManyToOne(() => Student, { onDelete: "CASCADE" })
  @JoinColumn({ name: "studentId" })
  student!: Student;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

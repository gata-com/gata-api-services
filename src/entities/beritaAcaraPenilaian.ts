import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { DefenseSchedule } from "./defenseSchedule";

@Entity("berita_acara_penilaians")
export class BeritaAcaraPenilaian {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "int" })
  jadwalId!: number;

  @Column({ type: "varchar", length: 500 })
  fileName!: string;

  @Column({ type: "text" })
  fileUrl!: string;

  @Column({ type: "decimal", precision: 5, scale: 2 })
  nilaiAkhir!: number;

  @Column({ length: 5 })
  nilaiHuruf!: string;

  @Column({ type: "text", nullable: true })
  catatan?: string;

  @ManyToOne(() => DefenseSchedule, { onDelete: "CASCADE" })
  @JoinColumn({ name: "jadwalId" })
  jadwal!: DefenseSchedule;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

// src/entities/PendaftaranTA.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm";
import { Mahasiswa } from "./mahasiswa";

@Entity()
export class PendaftaranTA {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Mahasiswa, (mahasiswa) => mahasiswa.pendaftaranTA, { eager: true })
  mahasiswa: Mahasiswa;

  @Column({ nullable: true })
  thesisDraft: string;

  @Column({ nullable: true })
  supportingFile: string;

  @Column({ nullable: true })
  exemptionLetter: string;

  @CreateDateColumn()
  createdAt: Date;
}

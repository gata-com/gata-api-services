// src/entities/Mahasiswa.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { PendaftaranTA } from "./pendaftaranTA";

@Entity()
export class Mahasiswa {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nim: string; // Nomor Induk Mahasiswa

  @Column()
  nama: string;

  @Column()
  email: string;

  @OneToMany(() => PendaftaranTA, (pendaftaran) => pendaftaran.mahasiswa)
  pendaftaranTA: PendaftaranTA[];
}

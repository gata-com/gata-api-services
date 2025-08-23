// entities/mahasiswa.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { PendaftaranTA } from "./pendaftaranTA";
import { AnggotaTA } from "./pendaftaranTA";

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

  // Relasi untuk pendaftaran TA yang dibuat oleh mahasiswa ini (sebagai pendaftar)
  @OneToMany(() => PendaftaranTA, (pendaftaran) => pendaftaran.mahasiswaPendaftar)
  pendaftaranTADibuat: PendaftaranTA[];

  // Relasi untuk semua anggota TA yang melibatkan mahasiswa ini
  @OneToMany(() => AnggotaTA, (anggota) => anggota.mahasiswa)
  anggotaTA: AnggotaTA[];
}
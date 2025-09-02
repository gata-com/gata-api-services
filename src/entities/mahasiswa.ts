// entities/mahasiswa.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { PendaftaranTA } from "./pendaftaranTA";
import { AnggotaTA } from "./pendaftaranTA";

@Entity('mahasiswa')
export class Mahasiswa {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nim: string; // Nomor Induk Mahasiswa

  @Column()
  nama: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  nomorTelepon: string;

  // Relasi untuk pendaftaran TA yang dibuat oleh mahasiswa ini (sebagai pendaftar)
  @OneToMany((type) => PendaftaranTA, (pendaftaran) => pendaftaran.mahasiswaPendaftar)
  pendaftaranTA: PendaftaranTA[];

  // Relasi untuk semua anggota TA yang melibatkan mahasiswa ini
  @OneToMany((type) => AnggotaTA, (anggota) => anggota.mahasiswa)
  anggotaTA: AnggotaTA[];
}
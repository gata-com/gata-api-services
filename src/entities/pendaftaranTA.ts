// entities/pendaftaranTA.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Mahasiswa } from "./mahasiswa";

export enum TAType {
  REGULER = "reguler",
  CAPSTONE = "capstone"
}

export enum TAStatus {
  BARU = "baru",
  DISPENSASI = "dispensasi"
}

export enum SumberTopik {
  DOSEN = "dosen",
  MAHASISWA = "mahasiswa",
  INSTANSI = "instansi"
}

// Entity utama untuk pendaftaran TA
@Entity("pendaftaran_ta")
export class PendaftaranTA {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Mahasiswa)
  mahasiswaPendaftar: Mahasiswa; // Mahasiswa yang mendaftar (perwakilan)

  // Menggunakan string reference untuk menghindari circular dependency
  @OneToMany("AnggotaTA", "pendaftaranTA", { cascade: true })
  anggotaTA: AnggotaTA[];

  @Column({ type: "enum", enum: TAType })
  tipeTA: TAType;

  @Column()
  jumlahAnggota: number; // 1 untuk reguler, 2-3 untuk capstone

  @Column({ type: "text" })
  judul: string;

  @Column({ type: "enum", enum: TAStatus })
  statusTA: TAStatus;

  @Column({ type: "text" })
  resumeKebaharuan: string;

  @Column()
  dosenPembimbing1: string;

  @Column({ nullable: true })
  dosenPembimbing2?: string;

  @Column({ nullable: true })
  draftTAPath?: string; // path file draft TA

  @Column({ nullable: true })
  filePendukungPath?: string; // path file pendukung

  @Column({ type: "enum", enum: SumberTopik })
  sumberTopik: SumberTopik;

  @Column({ nullable: true })
  suratDispensasiPath?: string; // path surat dispensasi (jika status dispensasi)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// Entity untuk menyimpan data setiap anggota TA
@Entity("anggota_ta")
export class AnggotaTA {
  @PrimaryGeneratedColumn()
  id: number;

  // Menggunakan string reference untuk menghindari circular dependency
  @ManyToOne("PendaftaranTA", "anggotaTA")
  pendaftaranTA: PendaftaranTA;

  @ManyToOne(() => Mahasiswa)
  mahasiswa: Mahasiswa;

  @Column()
  urutan: number; // 1, 2, 3 sesuai urutan anggota

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
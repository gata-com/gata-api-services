// services/pendaftaranTAService.ts
import AppDataSource from "../config/database";
import {
  PendaftaranTA,
  AnggotaTA,
  TAType,
  TAStatus,
  SumberTopik,
} from "../entities/_pendaftaranTA";
import { Mahasiswa } from "../entities/mahasiswa";

const pendaftaranTARepo = AppDataSource.getRepository(PendaftaranTA);
const anggotaTARepo = AppDataSource.getRepository(AnggotaTA);
const mahasiswaRepo = AppDataSource.getRepository(Mahasiswa);

export interface AnggotaData {
  mahasiswaId: number;
  urutan: number;
}

export interface CreatePendaftaranTAData {
  mahasiswaPendaftarId: number; // ID mahasiswa yang mendaftar (perwakilan)
  anggotaTA: AnggotaData[]; // Array data anggota TA
  tipeTA: TAType;
  jumlahAnggota: number;
  judul: string;
  statusTA: TAStatus;
  resumeKebaharuan: string;
  dosenPembimbing1: string;
  dosenPembimbing2?: string;
  sumberTopik: SumberTopik;
  draftTAPath?: string;
  filePendukungPath?: string;
  suratDispensasiPath?: string;
}

export const createPendaftaranTA = async (data: CreatePendaftaranTAData) => {
  // Validasi mahasiswa pendaftar
  const mahasiswaPendaftar = await mahasiswaRepo.findOneBy({
    id: data.mahasiswaPendaftarId,
  });
  if (!mahasiswaPendaftar)
    throw new Error("Mahasiswa pendaftar tidak ditemukan");

  // Validasi jumlah anggota sesuai tipe TA
  if (data.tipeTA === TAType.REGULER && data.jumlahAnggota !== 1) {
    throw new Error("TA Reguler harus memiliki 1 anggota");
  }
  if (
    data.tipeTA === TAType.CAPSTONE &&
    (data.jumlahAnggota < 2 || data.jumlahAnggota > 3)
  ) {
    throw new Error("TA Capstone harus memiliki 2-3 anggota");
  }

  // Validasi jumlah data anggota sesuai jumlah anggota yang dipilih
  if (data.anggotaTA.length !== data.jumlahAnggota) {
    throw new Error(
      `Jumlah data anggota harus sesuai dengan jumlah anggota yang dipilih (${data.jumlahAnggota})`
    );
  }

  // Validasi semua anggota TA ada di database
  const anggotaIds = data.anggotaTA.map((anggota) => anggota.mahasiswaId);
  const mahasiswaAnggota = await mahasiswaRepo.find({
    where: anggotaIds.map((id) => ({ id })),
  });

  if (mahasiswaAnggota.length !== anggotaIds.length) {
    throw new Error("Beberapa anggota TA tidak ditemukan di database");
  }

  // Validasi tidak ada duplikasi mahasiswa
  const uniqueIds = new Set(anggotaIds);
  if (uniqueIds.size !== anggotaIds.length) {
    throw new Error("Tidak boleh ada mahasiswa yang duplikat dalam anggota TA");
  }

  // Validasi surat dispensasi jika status dispensasi
  if (data.statusTA === TAStatus.DISPENSASI && !data.suratDispensasiPath) {
    throw new Error("Surat dispensasi wajib diupload untuk status dispensasi");
  }

  // Mulai transaction
  return await AppDataSource.transaction(async (manager) => {
    // Create pendaftaran TA
    const pendaftaran = manager.create(PendaftaranTA, {
      mahasiswaPendaftar,
      tipeTA: data.tipeTA,
      jumlahAnggota: data.jumlahAnggota,
      judul: data.judul,
      statusTA: data.statusTA,
      resumeKebaharuan: data.resumeKebaharuan,
      dosenPembimbing1: data.dosenPembimbing1,
      dosenPembimbing2: data.dosenPembimbing2,
      sumberTopik: data.sumberTopik,
      draftTAPath: data.draftTAPath,
      filePendukungPath: data.filePendukungPath,
      suratDispensasiPath: data.suratDispensasiPath,
    });

    const savedPendaftaran = await manager.save(PendaftaranTA, pendaftaran);

    // Create anggota TA
    const anggotaEntities = data.anggotaTA.map((anggotaData) => {
      const mahasiswa = mahasiswaAnggota.find(
        (m) => m.id === anggotaData.mahasiswaId
      );
      return manager.create(AnggotaTA, {
        pendaftaranTA: savedPendaftaran,
        mahasiswa: mahasiswa!,
        urutan: anggotaData.urutan,
      });
    });

    await manager.save(AnggotaTA, anggotaEntities);

    // Return dengan relasi
    return await manager.findOne(PendaftaranTA, {
      where: { id: savedPendaftaran.id },
      relations: ["mahasiswaPendaftar", "anggotaTA", "anggotaTA.mahasiswa"],
    });
  });
};

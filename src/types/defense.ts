export interface Mahasiswa {
  id: number;
  nama: string;
  nim: string;
  email?: string;
}

export interface DokumenPendukung {
  id: number;
  nama: string;
  url: string;
  uploadedAt: string;
}

export type StatusPengajuan = "menunggu" | "disetujui" | "ditolak";
export type JenisSidang = "proposal" | "hasil";

export interface PengajuanSidang {
  id: number;
  mahasiswa: Mahasiswa | Mahasiswa[]; // Reguler = 1, Capstone = 2-3
  tipeTA: "regular" | "capstone";
  jenisSidang: JenisSidang;
  judulTA: string;
  jumlahBimbingan: number;
  minimalBimbingan: number;
  status: StatusPengajuan;
  tanggalPengajuan: string;
  tanggalDiproses?: string;
  dokumenPendukung: DokumenPendukung[];
  catatan?: string;
  catatanPenolakan?: string;
  kelompokKeahlian?: string;
  dosenPembimbing?: {
    id: number;
    nama: string;
  }[];
}

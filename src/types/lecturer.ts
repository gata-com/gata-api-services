export interface FPApprovalRequest {
  fpId: number;
  status: "approved" | "rejected";
  supervisor_choices: "1" | "2";
  note: string | null;
}

export interface FPAddSlotRequest {
  userId: number;
  supervisorType: "1" | "2";
  amount: number;
}

export interface AvailabilityRequest {
  id?: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  location: string;
  user_id: number;
}

export interface GuidanceActionRequest {
  id: number;
  status: "scheduled" | "ongoing" | "completed" | "no_show" | "cancelled";
  lecturer_feedback?: string;
}

export interface DefenseApprovalRequest {
  id: number;
  status: "approved" | "rejected";
  rejection_notes?: string;
}

export interface TotalStudentsResponse {
  id: number;
  day_of_week: "1" | "2" | "3" | "4" | "5";
  session_date: string; // format: YYYY-MM-DD
  start_time: string; // format: HH:mm
  end_time: string; // format: HH:mm
  tipeTA: "regular" | "capstone";
  location: string;
  defense_type: "proposal" | "hasil";
  topic: string;
  lecturer_feedback?: string;
  status: "scheduled" | "ongoing" | "completed" | "no_show" | "cancelled";
  mahasiswa: {
    id: number;
    name: string;
    nim: string;
  }[];
  draftLinks?: {
    id: number;
    name: string;
    url: string;
    uploaded_at?: string;
  }[];
}

export interface DosenNilai {
  lecturerId: number;
  kode: string;
  nama: string;
  nilai: number;
  tanggal: string;
}

export interface JadwalKomentar {
  kode: string;
  nama: string;
  komentar: string;
  tanggal: string;
}

export interface JadwalRekap {
  rata2Pembimbing: number;
  rata2Penguji: number;
  nilaiAkhir?: number; // Optional - kosong jika tidak memenuhi syarat (< 2 penguji atau < 1 pembimbing)
  nilaiHuruf: string;
  isFinalized: boolean;
  finalisasiOleh?: string;
  detailPerDosen: DosenNilai[];
}

export interface OpsiJawabanResponse {
  id: string;
  text: string;
  nilai: number;
  urutan: number;
}

export interface PertanyaanResponse {
  id: string;
  text: string;
  bobot: number;
  urutan: number;
  opsiJawabans: OpsiJawabanResponse[];
}

export interface RubrikGroupResponse {
  id: string;
  nama: string;
  bobotTotal: number;
  urutan: number;
  isDefault: boolean;
  pertanyaans: PertanyaanResponse[];
}

export interface RubrikResponse {
  id: string;
  nama: string;
  deskripsi?: string;
  type: "SID" | "SEM";
  isDefault: boolean;
  isActive: boolean;
  groups: RubrikGroupResponse[];
}

export interface Jadwal {
  jadwalId: number;
  penilaianId?: string;
  studentId: number;
  nama: string;
  nim: string;
  jenisSidang: "PROPOSAL" | "HASIL";
  statusKehadiran: "HARI INI" | "LEWAT" | "MENDATANG";
  tanggal: string;
  waktu: string;
  judul: string;
  lokasi: string;
  tipeTA: "Capstone" | "Reguler";
  pembimbing1: string;
  pembimbing2: string;
  penguji1: string;
  penguji2: string;
  laporanTA: string;
  slidePresentasi: string;
  statusPenilaian: "belum_dinilai" | "sudah_dinilai" | "terkunci";

  nilaiPertanyaan?: {
    [pertanyaanId: string]: number;
  };
  catatanMahasiswa?: string;
  isSupervisor1: boolean; // Penanda apakah dosen adalah pembimbing 1 (untuk finalisasi & lihat all)
  isCanFinalize: boolean; // Penanda apakah dosen bisa finalisasi penilaian
  rekap?: JadwalRekap;
  catatan?: string;
  nilaiAkhirDosenini?: number;
  nilaiHurufDosenini?: string;
  komentar?: JadwalKomentar[];
  rubrik?: RubrikResponse;
  rentangNilai?: Array<{
    id: string;
    urutan: number;
    grade: string;
    minScore: number;
  }>;
  BAPUrl: {
    pdfName: string | null;
    pdfUrl: string | null;
  };
}

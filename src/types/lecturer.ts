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
  lecturerNama: string;
  role: "Pembimbing" | "Penguji";
  nilaiAkhir: number;
  perGroup: Array<{
    groupId: string;
    groupNama: string;
    nilaiGroup: number;
    bobotGroup: number;
  }>;
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
  nilaiAkhir: number;
  nilaiHuruf: string;
  finalisasiOleh?: string;
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
  id: string;
  nama: string;
  nim: string;
  jenisSidang: "PROPOSAL" | "HASIL";
  statusKehadiran: "HARI INI" | "LEWAT" | "MENDATANG";
  tanggal: string;
  waktu: string;
  judul: string;
  lokasi: string;
  capstone: string;
  pembimbing1: string;
  pembimbing2: string;
  penguji1: string;
  penguji2: string;
  laporanTA?: string;
  slidePresentasi?: string;
  statusPenilaian: "belum_dinilai" | "sudah_dinilai" | "terkunci";
  nilaiPertanyaan?: {
    [pertanyaanId: string]: number;
  };
  catatanMahasiswa?: string;
  rekap?: JadwalRekap;
  dosenNilai?: DosenNilai[];
  catatan?: string;
  komentar?: JadwalKomentar[];
  rubrik?: RubrikResponse;
}

export interface FinalProjectSearchByQueryRequest {
  query: string;
}

export interface FinalProjectCreateRequest {
  type: string;
  status: string;
  source_topic: string;
  supervisor1Id: string;
  supervisor2Id: string;
  finalProjectPeriodId: string;
  members: FinalProjectData[];
}

export interface FinalProjectData {
  email: string;
  studentId: string;
  title: string;
  resume: string;
  draft_path?: Express.Multer.File | null;
  dispen_path?: Express.Multer.File | null;
}

export interface FPChangeSupervisorRequest {
  fpId: number;
  supervisor_1: number | null;
  supervisor_2: number | null;
}

export interface GuidanceSessionCreateRequest {
  fpId: number;
  lecturerId: number;
  GAId: number;
  topic: string;
  supervisor_type: 1 | 2;
  draftLinks: {
    id: string;
    name: string;
    url: string;
  }[];
}

export interface GuidanceDashboardRequest {
  id: number;
  lecture_name: string;
  lecture_nip: string;
  day_of_week: "1" | "2" | "3" | "4" | "5";
  session_date: string;
  start_time: string;
  end_time: string;
  topic: string;
  location: string;
  status: "scheduled" | "ongoing" | "completed" | "cancelled" | "no_show";
  created_at: string;
  draftLinks: {
    id: number;
    name: string;
    url: string;
  }[];
  lecturer_feedback?: string;
}

export interface GuidanceDefenseRequest {
  tipeSidang: "proposal" | "hasil";
  fpId: number;
  lecturerId: number;
  expertiseGroup1Id: number;
  expertiseGroup2Id: number;
  defenseDocuments: DefenseDocumentRequest[];
}

export interface DefenseDocumentRequest {
  name: string;
  url: string;
  type: "draft" | "ppt";
  email: string;
  studentId?: number;
}

// ============ Hasil Sidang Types ============

export interface StudentInfo {
  id: string;
  nama: string;
  nim: string;
  tanggalSidang: string;
  judulTA?: string;
  programStudi?: string;
}

export interface DosenPenguji {
  no: number;
  id: string;
  nama: string;
  peran: "Pembimbing 1" | "Pembimbing 2" | "Penguji 1" | "Penguji 2";
  nilai: number; // Score given by this assessor
  status: "Lulus" | "Tidak Lulus" | "Menunggu"; // Assessment status
}

export interface HasilSidang {
  id: string;
  studentId: string;
  studentInfo: StudentInfo;
  dosenList: DosenPenguji[];
  hasilAkhir: "LULUS" | "TIDAK LULUS" | "MENUNGGU"; // Overall result
  nilaiAkhir?: number; // Final score
  nilaiHuruf?: string; // Letter grade (A, B, C, D, E)
  bapUrl?: string; // URL to download signed BAP document
  createdAt?: string;
  updatedAt?: string;
}

export interface BAPFile {
  bapUrl: string;
  fileName: string;
  contentType: string;
  fileSize: number;
}

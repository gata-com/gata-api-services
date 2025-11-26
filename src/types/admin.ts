export interface FinalProjectPeriodsRequest {
  start_date: string;
  end_date: string;
  approval_end_date?: string;
  description?: string;
}

export interface FPApprovalRequest {
  fpId: number;
  status: "approved" | "rejected";
}

// BAP PDF Types
export interface BapPdfGenerateRequest {
  jadwalId: number;
  studentId: number;
}

export interface BapPdfResponse {
  id: string;
  pdfName: string;
  pdfUrl: string;
  nilaiAkhir: number;
  nilaiHuruf: string;
  generatedAt: Date;
  student?: {
    id: number;
    nim: string;
    name: string;
  };
}

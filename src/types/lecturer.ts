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

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

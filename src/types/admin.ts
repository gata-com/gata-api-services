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

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

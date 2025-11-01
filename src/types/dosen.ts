export interface FPApprovalRequest {
  fpId: number;
  status: "approved" | "rejected";
  supervisor_choices: "1" | "2";
  note: string | null;
}

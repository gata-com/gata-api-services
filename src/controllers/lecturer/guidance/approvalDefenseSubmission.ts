import { Request, Response } from "express";
import { ApiResponse } from "@/types";
import { GuidanceService } from "@/services/lecturer/guidanceServices";
import { AvailabilityRequest, DefenseApprovalRequest } from "@/types/lecturer";

export const approvalDefenseSubmission = async (
  req: Request,
  res: Response<ApiResponse>
) => {
  const body: DefenseApprovalRequest = req.body;
  try {
    const guidanceService = new GuidanceService();
    const result = await guidanceService.approvalDefenseSubmission(body);

    if ("error" in result && result.error) {
      return res.status(400).json({
        message: "Error Validation",
        errors: result.error,
      });
    }
    return res.status(201).json({
      message: "Ketersediaan bimbingan berhasil diperbarui",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Terjadi kesalahan",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

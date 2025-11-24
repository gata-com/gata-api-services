import { Request, Response } from "express";
import { ApiResponse } from "@/types";
import { DefenseSubmissionService } from "@/services/admin/defenseSubmissionService";

export const getNotScheduled = async (
  req: Request,
  res: Response<ApiResponse>
) => {
  try {
    const defenseSubmissionService = new DefenseSubmissionService();
    const result = await defenseSubmissionService.getNotScheduled();

    if ("error" in result && result.error) {
      return res.status(400).json({
        message: "Error Validation",
        errors: result.error,
      });
    }
    return res.status(200).json({
      message: "Data ditemukan",
      data: result.data,
      // pagination: {
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

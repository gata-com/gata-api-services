import { Request, Response } from "express";
import { ApiResponse } from "@/types";
import { GuidanceService } from "@/services/student/guidanceServices";
import { GuidanceSessionCreateRequest } from "@/types/student";

export const createSubmission = async (
  req: Request,
  res: Response<ApiResponse>
) => {
  const body: GuidanceSessionCreateRequest = req.body;

  try {
    const guidanceService = new GuidanceService();
    const result = await guidanceService.createSubmission(body);

    if ("error" in result && result.error) {
      return res.status(400).json({
        message: "Error Validation",
        errors: result.error,
      });
    }

    return res.status(201).json({
      message: "Pengajuan bimbingan berhasil dibuat",
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

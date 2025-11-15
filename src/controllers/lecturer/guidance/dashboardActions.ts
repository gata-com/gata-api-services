import { Request, Response } from "express";
import { ApiResponse } from "@/types";
import { GuidanceService } from "@/services/lecturer/guidanceServices";
import { GuidanceActionRequest } from "@/types/lecturer";

export const dashboardActions = async (
  req: Request,
  res: Response<ApiResponse>
) => {
  const body: GuidanceActionRequest = req.body;
  try {
    const guidanceService = new GuidanceService();
    const result = await guidanceService.dashboardActions(body);

    if ("error" in result && result.error) {
      return res.status(400).json({
        message: "Error Validation",
        errors: result.error,
      });
    }

    return res.status(200).json({
      message: "Dashboard actions berhasil",
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

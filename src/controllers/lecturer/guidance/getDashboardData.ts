import { Request, Response } from "express";
import { ApiResponse } from "@/types";
import { GuidanceService } from "@/services/lecturer/guidanceServices";

export const getDashboardData = async (
  req: Request,
  res: Response<ApiResponse>
) => {
  const { userId } = req.params;
  try {
    const guidanceService = new GuidanceService();
    const result = await guidanceService.getDashboard(parseInt(userId));

    if ("error" in result && result.error) {
      return res.status(400).json({
        message: "Error Validation",
        errors: result.error,
      });
    }

    return res.status(200).json({
      message: "Data dashboard bimbingan berhasil diambil",
      data: result.data,
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

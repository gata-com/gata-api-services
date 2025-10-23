import { Request, Response } from "express";
import { ApiResponse } from "@/types";
import { TugasAkhirService } from "@/services/dosen/tugasAkhirServices";

export const getValidationStats = async (
  req: Request,
  res: Response<ApiResponse>
) => {
  try {
    const { userId } = req.params;

    const tugasAkhirService = new TugasAkhirService();
    const result = await tugasAkhirService.getValidationStats(parseInt(userId));

    if ("error" in result && result.error) {
      return res.status(400).json({
        message: "Error Validation",
        errors: result.error,
      });
    }
    return res.status(200).json({
      message: "Data ditemukan",
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

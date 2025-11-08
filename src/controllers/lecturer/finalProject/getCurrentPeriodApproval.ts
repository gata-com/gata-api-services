import { Request, Response } from "express";
import { ApiResponse } from "@/types";
import { TugasAkhirService } from "@/services/admin/tugasAkhirServices";

export const getCurrentPeriodApproval = async (
  req: Request,
  res: Response<ApiResponse>
) => {
  try {
    const finalProjectPeriodService = new TugasAkhirService();
    const currentPeriod =
      await finalProjectPeriodService.getCurrentPeriodApproval();
    return res.status(200).json({
      message: "Periode tugas akhir saat ini",
      data: currentPeriod,
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

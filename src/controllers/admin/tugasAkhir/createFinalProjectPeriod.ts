import { Request, Response } from "express";
import { ApiResponse } from "@/types";
import { FinalProjectPeriodsRequest } from "@/types/admin";
import { TugasAkhirService } from "@/services/admin/tugasAkhirService";

export const getCurrentPeriod = async (
  req: Request,
  res: Response<ApiResponse>
) => {
  try {
    const finalProjectPeriodService = new TugasAkhirService();
    const currentPeriod = await finalProjectPeriodService.getCurrentPeriod();
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

export const create = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const finalProjectPeriodService = new TugasAkhirService();
    const result = await finalProjectPeriodService.createPeriod(req.body);

    if ("error" in result && result.error) {
      return res.status(400).json({
        message: "Error Validation",
        errors: result.error,
      });
    }

    return res.status(201).json({
      message: "Periode tugas akhir berhasil dibuat",
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

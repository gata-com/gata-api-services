import { Request, Response } from "express";
import { ApiResponse } from "@/types";
import { FinalProjectCreateRequest } from "@/types/student";
import { TugasAkhirService } from "@/services/student/tugasAkhirServices";

export const getHistoryByUserId = async (
  req: Request,
  res: Response<ApiResponse>
) => {
  try {
    const { userId } = req.params;
    const finalProjectService = new TugasAkhirService();
    const result = await finalProjectService.getHistoryByUserId(userId);

    if ("error" in result && result.error) {
      return res.status(400).json({
        message: "Error Validation",
        errors: result.error,
      });
    }

    return res.status(200).json({
      message: "Riwayat tugas akhir berhasil diambil",
      data: result,
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

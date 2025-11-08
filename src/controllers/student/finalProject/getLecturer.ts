import { Request, Response } from "express";
import { ApiResponse } from "@/types";
import { TugasAkhirService } from "@/services/student/tugasAkhirServices";

export const getLecturer = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const tugasAkhirService = new TugasAkhirService();
    const result = await tugasAkhirService.getLecturers();

    if ("error" in result && result.error) {
      return res.status(400).json({
        message: "Error Validation",
        errors: result.error,
      });
    }
    return res.status(200).json({
      message: "Data dosen ditemukan",
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

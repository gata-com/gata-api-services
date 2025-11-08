import { Request, Response } from "express";
import { ApiResponse } from "@/types";
import { FinalProjectCreateRequest } from "@/types/student";
import { TugasAkhirService } from "@/services/student/tugasAkhirServices";

export const create = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const finalProjectService = new TugasAkhirService();

    const result = await finalProjectService.createFinalProject(
      req,
      req.body as FinalProjectCreateRequest
    );

    if ("error" in result && result.error) {
      return res.status(400).json({
        message: "Error Validation",
        errors: result.error,
      });
    }

    return res.status(201).json({
      message: "Tugas akhir berhasil dibuat",
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

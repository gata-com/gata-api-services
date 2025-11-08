import { Request, Response } from "express";
import { ApiResponse } from "@/types";
import { FPChangeSupervisorRequest } from "@/types/student";
import { TugasAkhirService } from "@/services/student/tugasAkhirServices";

export const changeSupervisor = async (
  req: Request,
  res: Response<ApiResponse>
) => {
  try {
    const finalProjectService = new TugasAkhirService();

    const result = await finalProjectService.changeSupervisor(
      req.body as FPChangeSupervisorRequest
    );

    if ("error" in result && result.error) {
      return res.status(400).json({
        message: "Error Validation",
        errors: result.error,
      });
    }

    return res.status(201).json({
      message: "Dosen pembimbing berhasil diubah",
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

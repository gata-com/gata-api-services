import { Request, Response } from "express";
import { ApiResponse } from "@/types";
import { TugasAkhirService } from "@/services/dosen/tugasAkhirServices";
import { FPAddSlotRequest } from "@/types/dosen";

export const addSlot = async (req: Request, res: Response<ApiResponse>) => {
  const body: FPAddSlotRequest = req.body;

  try {
    const finalProjectService = new TugasAkhirService();
    const result = await finalProjectService.addSlot(body);

    if ("error" in result && result.error) {
      return res.status(400).json({
        message: "Error Validation",
        errors: result.error,
      });
    }

    return res.status(201).json({
      message: "Slot berhasil ditambahkan",
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

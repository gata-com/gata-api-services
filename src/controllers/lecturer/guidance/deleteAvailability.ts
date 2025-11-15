import { Request, Response } from "express";
import { ApiResponse } from "@/types";
import { GuidanceService } from "@/services/lecturer/guidanceServices";
import { AvailabilityRequest } from "@/types/lecturer";

export const deleteAvailability = async (
  req: Request,
  res: Response<ApiResponse>
) => {
  const { id } = req.params;
  try {
    const guidanceService = new GuidanceService();
    const result = await guidanceService.deleteAvailability(id);

    if ("error" in result && result.error) {
      return res.status(400).json({
        message: "Error Validation",
        errors: result.error,
      });
    }

    return res.status(200).json({
      message: "Ketersediaan bimbingan berhasil diperoleh",
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

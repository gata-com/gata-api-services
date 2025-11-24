import { Request, Response } from "express";
import { ApiResponse } from "@/types";
import { DefenseScheduleImportService } from "@/services/admin/defenseScheduleService";

export const deleteSchedule = async (
  req: Request,
  res: Response<ApiResponse>
) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Error Validation",
        errors: {
          path: "id",
          msg: "ID jadwal wajib diisi",
        },
      });
    }

    const scheduleService = new DefenseScheduleImportService();
    const result = await scheduleService.deleteSchedule(parseInt(id));

    if ("error" in result && result.error) {
      return res.status(400).json({
        message: "Error Validation",
        errors: result.error,
      });
    }

    return res.status(200).json({
      message: "Jadwal berhasil dihapus",
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

import { Request, Response } from "express";
import { ApiResponse } from "@/types";
import { DefenseScheduleImportService } from "@/services/admin/defenseScheduleService";

export const editSchedule = async (
  req: Request,
  res: Response<ApiResponse>
) => {
  try {
    const { id } = req.params;
    const { tanggal, mulai, selesai, lokasi, penguji1, penguji2, pengajuanId } =
      req.body;

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

    // Update schedule dengan examiner jika ada penguji1 atau penguji2
    if ((penguji1 || penguji2) && pengajuanId) {
      const result = await scheduleService.updateScheduleWithExaminer(
        parseInt(id),
        pengajuanId,
        {
          tanggal,
          mulai,
          selesai,
          lokasi,
          penguji1,
          penguji2,
        }
      );

      if ("error" in result && result.error) {
        return res.status(400).json({
          message: "Error Validation",
          errors: {
            path: "server",
            msg: result.error,
          },
        });
      }

      return res.status(200).json({
        message: "Jadwal berhasil diupdate",
        data: result.data,
      });
    } else {
      // Update schedule tanpa examiner
      const result = await scheduleService.updateSchedule(parseInt(id), {
        tanggal,
        mulai,
        selesai,
        lokasi,
      });

      if ("error" in result && result.error) {
        return res.status(400).json({
          message: "Error Validation",
          errors: {
            path: "server",
            msg: result.error,
          },
        });
      }

      return res.status(200).json({
        message: "Jadwal berhasil diupdate",
        data: result.data,
      });
    }
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

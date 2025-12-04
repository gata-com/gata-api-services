import { Request, Response } from "express";
import { ApiResponse, AuthRequest } from "@/types";
import { HasilSidangService } from "@/services/student/hasilSidangService";

/**
 * GET /mahasiswa/hasil-sidang
 * Mengambil daftar semua hasil sidang (untuk admin atau overview)
 */
export const getHasilSidangList = async (
  req: AuthRequest,
  res: Response<ApiResponse>
) => {
  try {
    // Get query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const filter = req.query.filter as string as
      | "LULUS"
      | "TIDAK_LULUS"
      | "MENUNGGU"
      | undefined;

    // Validasi pagination
    if (page < 1 || limit < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination parameters",
        errors: {
          path: "pagination",
          msg: "Page dan limit harus lebih besar dari 0",
        },
      });
    }

    const hasilSidangService = new HasilSidangService();
    const result = await hasilSidangService.getAllHasilSidang(
      page,
      limit,
      filter
    );

    return res.status(200).json({
      success: true,
      message: "Daftar hasil sidang berhasil diambil",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error in getHasilSidangList:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil daftar hasil sidang",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

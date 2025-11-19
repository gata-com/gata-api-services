import { Request, Response } from "express";
import { PenilaianService } from "@/services/admin/penilaianService";
import { ApiResponse } from "@/types";

const penilaianService = new PenilaianService();

/**
 * Submit/Update penilaian
 * POST /dosen/penilaian/jadwal/:jadwalId/nilai
 */
export const submitPenilaian = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const jadwalId = parseInt(req.params.jadwalId);

    if (isNaN(jadwalId)) {
      return res.status(400).json({
        message: "Invalid jadwal ID",
        errors: { path: "jadwalId", msg: "Jadwal ID must be a number" },
      });
    }

    // @ts-ignore - user added by auth middleware
    const lecturerId = req.user?.lecturer?.id;

    if (!lecturerId) {
      return res.status(403).json({
        message: "Forbidden",
        errors: { path: "user", msg: "Lecturer ID not found" },
      });
    }

    const { jawaban, catatan } = req.body;

    if (!jawaban || !Array.isArray(jawaban) || jawaban.length === 0) {
      return res.status(400).json({
        message: "Jawaban tidak boleh kosong",
        errors: {
          path: "jawaban",
          msg: "Jawaban is required and must be an array",
        },
      });
    }

    const penilaian = await penilaianService.submitPenilaian(
      jadwalId,
      lecturerId,
      jawaban,
      catatan
    );

    return res.status(200).json({
      message: "Penilaian berhasil disimpan",
      data: penilaian,
    });
  } catch (error) {
    console.error("Error submitting penilaian:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

/**
 * Get penilaian dosen
 * GET /dosen/penilaian/jadwal/:jadwalId/nilai
 */
export const getPenilaianDosen = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const jadwalId = parseInt(req.params.jadwalId);

    if (isNaN(jadwalId)) {
      return res.status(400).json({
        message: "Invalid jadwal ID",
        errors: { path: "jadwalId", msg: "Jadwal ID must be a number" },
      });
    }

    // @ts-ignore - user added by auth middleware
    const lecturerId = req.user?.lecturer?.id;

    if (!lecturerId) {
      return res.status(403).json({
        message: "Forbidden",
        errors: { path: "user", msg: "Lecturer ID not found" },
      });
    }

    const penilaian = await penilaianService.getPenilaianDosen(
      jadwalId,
      lecturerId
    );

    if (!penilaian) {
      return res.status(404).json({
        message: "Penilaian belum ada",
        errors: { path: "penilaian", msg: "Penilaian not found" },
      });
    }

    return res.status(200).json({
      message: "Penilaian retrieved successfully",
      data: penilaian,
    });
  } catch (error) {
    console.error("Error getting penilaian:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

/**
 * Get rekap nilai
 * GET /dosen/penilaian/jadwal/:jadwalId/rekap
 */
export const getRekapNilai = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const jadwalId = parseInt(req.params.jadwalId);

    if (isNaN(jadwalId)) {
      return res.status(400).json({
        message: "Invalid jadwal ID",
        errors: { path: "jadwalId", msg: "Jadwal ID must be a number" },
      });
    }

    const rekap = await penilaianService.getRekapNilai(jadwalId);

    return res.status(200).json({
      message: "Rekap nilai retrieved successfully",
      data: rekap,
    });
  } catch (error) {
    console.error("Error getting rekap nilai:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

/**
 * Get komentar dosen
 * GET /dosen/penilaian/jadwal/:jadwalId/komentar
 */
export const getKomentarDosen = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const jadwalId = parseInt(req.params.jadwalId);

    if (isNaN(jadwalId)) {
      return res.status(400).json({
        message: "Invalid jadwal ID",
        errors: { path: "jadwalId", msg: "Jadwal ID must be a number" },
      });
    }

    const komentars = await penilaianService.getKomentarDosen(jadwalId);

    return res.status(200).json({
      message: "Komentar retrieved successfully",
      data: komentars,
    });
  } catch (error) {
    console.error("Error getting komentar:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

/**
 * Finalisasi nilai (Pembimbing 1 only)
 * POST /dosen/penilaian/jadwal/:jadwalId/finalisasi
 */
export const finalisasiNilai = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const jadwalId = parseInt(req.params.jadwalId);

    if (isNaN(jadwalId)) {
      return res.status(400).json({
        message: "Invalid jadwal ID",
        errors: { path: "jadwalId", msg: "Jadwal ID must be a number" },
      });
    }

    // @ts-ignore - user added by auth middleware
    const lecturerId = req.user?.lecturer?.id;

    if (!lecturerId) {
      return res.status(403).json({
        message: "Forbidden",
        errors: { path: "user", msg: "Lecturer ID not found" },
      });
    }

    await penilaianService.finalisasiNilai(jadwalId, lecturerId);

    return res.status(200).json({
      message: "Nilai berhasil difinalisasi",
    });
  } catch (error) {
    console.error("Error finalisasi nilai:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

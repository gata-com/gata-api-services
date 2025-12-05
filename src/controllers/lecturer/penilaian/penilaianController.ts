import { Request, Response } from "express";
import { PenilaianService } from "@/services/lecturer/penilaianService";
import { LecturerRepository } from "@/repositories/LecturerRepository";
import { ApiResponse } from "@/types";
import { Jadwal } from "@/types/lecturer";

const penilaianService = new PenilaianService();
const lecturerRepo = new LecturerRepository();

/**
 * Get jadwal sidang per dosen (pembimbing atau penguji)
 * GET /lecturer/penilaian/jadwal/:userId
 */
export const getPenilaian = async (
  req: Request,
  res: Response<ApiResponse<Jadwal[]>>
): Promise<Response> => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({
        message: "Invalid user ID",
        errors: { path: "userId", msg: "User ID must be a number" },
      });
    }

    // Get lecturer by userId
    const lecturer = await lecturerRepo.findByUserId(userId);

    if (!lecturer) {
      return res.status(404).json({
        message: "Dosen tidak ditemukan",
        errors: { path: "lecturer", msg: "Lecturer not found for this user" },
      });
    }

    // Get jadwal untuk dosen ini
    const jadwals = await penilaianService.getJadwalByLecturer(lecturer.id);

    return res.status(200).json({
      message: "Jadwal berhasil diambil",
      data: jadwals,
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
 * Finalisasi nilai (Pembimbing 1 only)
 * POST /dosen/penilaian/jadwal/:jadwalId/finalisasi
 */
export const finalisasiNilai = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { jadwalId, studentId } = req.body;

    await penilaianService.finalisasiNilai(jadwalId, studentId);

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

/**
 * Save penilaian (Simpan Nilai)
 * POST /dosen/penilaian/simpan-nilai
 * Request body:
 * {
 *   jadwalId: number,
 *   userId: number,
 *   studentId: number,
 *   nilaiPertanyaan: { [pertanyaanId: string]: number },
 *   nilaiAkhir: number,
 *   nilaiHuruf: string,
 *   catatan: string
 * }
 */
export const savePenilaian = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const {
      jadwalId,
      userId,
      studentId,
      nilaiPertanyaan,
      nilaiAkhir,
      nilaiHuruf,
      catatan,
    } = req.body;

    // Call service to save penilaian dengan nilai yang sudah dihitung dari frontend
    const result = await penilaianService.savePenilaianWithPreCalculatedValues(
      jadwalId,
      nilaiPertanyaan,
      nilaiAkhir,
      nilaiHuruf,
      catatan,
      userId,
      studentId
    );

    return res.status(200).json({
      success: true,
      message: "Nilai penilaian berhasil disimpan",
      data: result,
    });
  } catch (error) {
    console.error("Error saving penilaian:", error);

    // Handle specific error cases
    const errorMsg = error instanceof Error ? error.message : "Unknown error";

    if (errorMsg.includes("Dosen tidak ditemukan")) {
      return res.status(403).json({
        success: false,
        message: "Dosen tidak ditemukan untuk user ini",
        data: null,
      });
    }

    if (errorMsg.includes("Jadwal tidak ditemukan")) {
      return res.status(404).json({
        success: false,
        message: "Jadwal tidak ditemukan",
        data: null,
      });
    }

    if (errorMsg.includes("tidak memiliki akses")) {
      return res.status(403).json({
        success: false,
        message:
          "Anda tidak memiliki akses untuk memberikan nilai pada jadwal ini",
        data: null,
      });
    }

    if (errorMsg.includes("sudah terkunci")) {
      return res.status(409).json({
        success: false,
        message: "Jadwal sudah terkunci",
        data: null,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server saat menyimpan nilai",
      data: null,
    });
  }
};

/**
 * Update penilaian yang sudah pernah disimpan (Update Nilai)
 * POST /dosen/penilaian/update-nilai
 * Request body:
 * {
 *   jadwalId: number,
 *   userId: number,
 *   studentId: number,
 *   nilaiPertanyaan: { [pertanyaanId: string]: number },
 *   catatan: string
 * }
 */
export const updateNilai = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const {
      penilaianId,
      jadwalId,
      userId,
      studentId,
      nilaiPertanyaan,
      nilaiAkhir,
      nilaiHuruf,
      catatan,
    } = req.body;

    // Call service to update penilaian
    const result = await penilaianService.updatePenilaian(
      penilaianId,
      jadwalId,
      nilaiPertanyaan,
      nilaiAkhir,
      nilaiHuruf,
      catatan,
      userId,
      studentId
    );

    return res.status(200).json({
      success: true,
      message: "Nilai penilaian berhasil diperbarui",
      data: result,
    });
  } catch (error) {
    console.error("Error updating penilaian:", error);

    // Handle specific error cases
    const errorMsg = error instanceof Error ? error.message : "Unknown error";

    if (errorMsg.includes("Dosen tidak ditemukan")) {
      return res.status(403).json({
        success: false,
        message: "Dosen tidak ditemukan untuk user ini",
        data: null,
      });
    }

    if (errorMsg.includes("Jadwal tidak ditemukan")) {
      return res.status(404).json({
        success: false,
        message: "Jadwal tidak ditemukan",
        data: null,
      });
    }

    if (errorMsg.includes("tidak ada penilaian sebelumnya")) {
      return res.status(404).json({
        success: false,
        message:
          "Tidak ada penilaian sebelumnya untuk diperbarui. Gunakan endpoint simpan-nilai untuk membuat penilaian baru.",
        data: null,
      });
    }

    if (errorMsg.includes("tidak memiliki akses")) {
      return res.status(403).json({
        success: false,
        message:
          "Anda tidak memiliki akses untuk memperbarui nilai pada jadwal ini",
        data: null,
      });
    }

    if (errorMsg.includes("sudah difinalisasi")) {
      return res.status(409).json({
        success: false,
        message:
          "Nilai sudah difinalisasi dan terkunci. Tidak dapat diperbarui.",
        data: null,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server saat memperbarui nilai",
      data: null,
    });
  }
};

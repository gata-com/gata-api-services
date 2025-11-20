import { Request, Response } from "express";
import { RentangNilaiService } from "@/services/admin/rentangNilaiService";
import { ApiResponse } from "@/types";

const rentangNilaiService = new RentangNilaiService();

/**
 * Get all rentang nilai
 * GET /admin/penilaian/rentang-nilai
 */
export const getAllRentangNilai = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const rentangNilais = await rentangNilaiService.getAllRentangNilai();

    return res.status(200).json({
      success: true,
      message: "Rentang nilai berhasil diambil",
      data: rentangNilais,
    });
  } catch (error) {
    console.error("Error getting rentang nilai:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server",
      error: "INTERNAL_SERVER_ERROR",
    });
  }
};

/**
 * Create rentang nilai
 * POST /admin/penilaian/rentang-nilai
 */
export const createRentangNilai = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { grade, minScore, urutan } = req.body;

    const rentangNilai = await rentangNilaiService.createRentangNilai({
      grade,
      minScore,
      urutan,
    });

    // Calculate maxScore for response
    const allRentang = await rentangNilaiService.getAllRentangNilai();
    const withMaxScore = allRentang.find((r: any) => r.id === rentangNilai.id);

    return res.status(201).json({
      success: true,
      message: "Rentang nilai berhasil dibuat",
      data: withMaxScore || rentangNilai,
    });
  } catch (error) {
    console.error("Error creating rentang nilai:", error);

    if (error instanceof Error && error.message === "DUPLICATE_GRADE") {
      return res.status(409).json({
        success: false,
        message: "Grade sudah ada",
        error: "CONFLICT",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server",
      error: "INTERNAL_SERVER_ERROR",
    });
  }
};

/**
 * Update rentang nilai
 * PUT /admin/penilaian/rentang-nilai/:id
 */
export const updateRentangNilai = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { id } = req.params;
    const rentangNilai = await rentangNilaiService.updateRentangNilai(
      id,
      req.body
    );

    if (!rentangNilai) {
      return res.status(404).json({
        success: false,
        message: "Rentang nilai dengan ID tersebut tidak ditemukan",
        error: "NOT_FOUND",
      });
    }

    // Calculate maxScore for response
    const allRentang = await rentangNilaiService.getAllRentangNilai();
    const withMaxScore = allRentang.find((r: any) => r.id === rentangNilai.id);

    return res.status(200).json({
      success: true,
      message: "Rentang nilai berhasil diupdate",
      data: withMaxScore || rentangNilai,
    });
  } catch (error) {
    console.error("Error updating rentang nilai:", error);

    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "Rentang nilai dengan ID tersebut tidak ditemukan",
          error: "NOT_FOUND",
        });
      }
      if (error.message === "DUPLICATE_GRADE") {
        return res.status(409).json({
          success: false,
          message: "Grade sudah ada",
          error: "CONFLICT",
        });
      }
    }

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server",
      error: "INTERNAL_SERVER_ERROR",
    });
  }
};

/**
 * Delete rentang nilai
 * DELETE /admin/penilaian/rentang-nilai/:id
 */
export const deleteRentangNilai = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { id } = req.params;
    const deleted = await rentangNilaiService.deleteRentangNilai(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Rentang nilai dengan ID tersebut tidak ditemukan",
        error: "NOT_FOUND",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Rentang nilai berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting rentang nilai:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server",
      error: "INTERNAL_SERVER_ERROR",
    });
  }
};

/**
 * Bulk upsert rentang nilai (create or update)
 * POST /admin/penilaian/rentang-nilai/bulk
 */
export const bulkUpdateRentangNilai = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { rentangNilai } = req.body;

    if (!rentangNilai || !Array.isArray(rentangNilai)) {
      return res.status(400).json({
        success: false,
        message: "rentangNilai harus berupa array",
        error: "VALIDATION_ERROR",
      });
    }

    const updatedItems = await rentangNilaiService.bulkUpsertRentangNilai(
      rentangNilai
    );

    return res.status(200).json({
      success: true,
      message: "Rentang nilai berhasil disimpan",
      data: {
        updated: updatedItems.length,
        items: updatedItems,
      },
    });
  } catch (error) {
    console.error("Error bulk updating rentang nilai:", error);

    if (error instanceof Error && error.message === "DUPLICATE_GRADE") {
      return res.status(409).json({
        success: false,
        message: "Grade sudah ada",
        error: "CONFLICT",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server",
      error: "INTERNAL_SERVER_ERROR",
    });
  }
};

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
      message: "Rentang nilai retrieved successfully",
      data: rentangNilais,
    });
  } catch (error) {
    console.error("Error getting rentang nilai:", error);
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

    return res.status(201).json({
      message: "Rentang nilai berhasil dibuat",
      data: rentangNilai,
    });
  } catch (error) {
    console.error("Error creating rentang nilai:", error);
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
        message: "Rentang nilai tidak ditemukan",
        errors: { path: "id", msg: "Rentang nilai not found" },
      });
    }

    return res.status(200).json({
      message: "Rentang nilai berhasil diupdate",
      data: rentangNilai,
    });
  } catch (error) {
    console.error("Error updating rentang nilai:", error);
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
 * Delete rentang nilai
 * DELETE /admin/penilaian/rentang-nilai/:id
 */
export const deleteRentangNilai = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { id } = req.params;
    await rentangNilaiService.deleteRentangNilai(id);

    return res.status(200).json({
      message: "Rentang nilai berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting rentang nilai:", error);
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
 * Bulk update rentang nilai
 * PUT /admin/penilaian/rentang-nilai/bulk
 */
export const bulkUpdateRentangNilai = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { rentangNilai } = req.body;

    const updates = rentangNilai;

    await rentangNilaiService.bulkUpdateRentangNilai(updates);

    return res.status(200).json({
      message: "Rentang nilai berhasil diupdate",
    });
  } catch (error) {
    console.error("Error bulk updating rentang nilai:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

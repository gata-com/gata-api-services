import { Request, Response } from "express";
import { AdminDashboardService } from "@/services/admin/adminDashboardService";
import { ApiResponse, AuthRequest } from "@/types";

const dashboardService = new AdminDashboardService();

/**
 * Get Admin Dashboard Statistics
 * GET /admin/dashboard/stats
 */
export const getDashboardStats = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { semester, tahun_akademik } = req.query;

    const stats = await dashboardService.getDashboardStats(
      semester as string | undefined,
      tahun_akademik as string | undefined
    );

    return res.status(200).json({
      success: true,
      message: "Statistics retrieved successfully",
      data: stats,
    });
  } catch (error) {
    console.error("Error getting dashboard stats:", error);

    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Terjadi kesalahan saat mengambil data statistik",
    });
  }
};

/**
 * Get System Status Overview
 * GET /admin/dashboard/system-status
 */
export const getSystemStatus = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const status = await dashboardService.getSystemStatus();

    return res.status(200).json({
      success: true,
      message: "System status retrieved",
      data: status,
    });
  } catch (error) {
    console.error("Error getting system status:", error);

    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Terjadi kesalahan saat mengambil status sistem",
    });
  }
};

/**
 * Get Quick Stats by Category
 * GET /admin/dashboard/quick-stats/:category
 */
export const getQuickStats = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { category } = req.params;

    if (!category) {
      return res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        message: "Category is required",
      });
    }

    const stats = await dashboardService.getQuickStats(category);

    return res.status(200).json({
      success: true,
      message: "Quick stats retrieved",
      data: stats,
    });
  } catch (error) {
    console.error("Error getting quick stats:", error);

    if (error instanceof Error && error.message === "INVALID_CATEGORY") {
      return res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        message:
          "Invalid category. Valid categories: mahasiswa_baru, dosen_aktif, sidang_selesai, sidang_terjadwal",
      });
    }

    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Terjadi kesalahan saat mengambil quick stats",
    });
  }
};

/**
 * Get Periode Information
 * GET /admin/dashboard/periode-info
 */
export const getPeriodeInfo = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const periodeInfo = await dashboardService.getPeriodeInfo();

    return res.status(200).json({
      success: true,
      message: "Periode information retrieved",
      data: periodeInfo,
    });
  } catch (error) {
    console.error("Error getting periode info:", error);

    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Terjadi kesalahan saat mengambil informasi periode",
    });
  }
};

/**
 * Get Dosen Verification Status
 * GET /admin/dashboard/dosen-verification-status
 */
export const getDosenVerificationStatus = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const verificationStatus =
      await dashboardService.getDosenVerificationStatus();

    return res.status(200).json({
      success: true,
      message: "Dosen verification status retrieved",
      data: verificationStatus,
    });
  } catch (error) {
    console.error("Error getting dosen verification status:", error);

    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Terjadi kesalahan saat mengambil status verifikasi dosen",
    });
  }
};

/**
 * Get Jadwal Sidang Status
 * GET /admin/dashboard/jadwal-sidang-status
 * Query: minggu_depan (boolean), bulan (1-12)
 */
export const getJadwalSidangStatus = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { minggu_depan, bulan } = req.query;

    const minggudepanFlag = minggu_depan === "true" ? true : false;
    const bulanNum = bulan ? parseInt(bulan as string) : undefined;

    // Validate bulan if provided
    if (bulanNum && (bulanNum < 1 || bulanNum > 12)) {
      return res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        message: "Bulan harus antara 1-12",
      });
    }

    const jadwalStatus = await dashboardService.getJadwalSidangStatus(
      minggudepanFlag,
      bulanNum
    );

    return res.status(200).json({
      success: true,
      message: "Jadwal sidang status retrieved",
      data: jadwalStatus,
    });
  } catch (error) {
    console.error("Error getting jadwal sidang status:", error);

    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Terjadi kesalahan saat mengambil status jadwal sidang",
    });
  }
};

/**
 * Get Recent Announcements
 * GET /admin/dashboard/pengumuman-terbaru
 * Query: limit (default: 2, max: 10)
 */
export const getRecentAnnouncements = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { limit = "2" } = req.query;

    const parsedLimit = Math.min(parseInt(limit as string) || 2, 10);

    if (parsedLimit < 1) {
      return res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        message: "Limit harus lebih besar dari 0",
      });
    }

    const announcements = await dashboardService.getRecentAnnouncements(
      parsedLimit
    );

    return res.status(200).json({
      success: true,
      message: "Recent announcements retrieved",
      data: announcements,
    });
  } catch (error) {
    console.error("Error getting recent announcements:", error);

    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Terjadi kesalahan saat mengambil pengumuman terbaru",
    });
  }
};

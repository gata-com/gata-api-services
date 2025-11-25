import { Request, Response } from "express";
import { LecturerDashboardService } from "@/services/lecturer/lecturerDashboardService";
import { ApiResponse, AuthRequest } from "@/types";

const dashboardService = new LecturerDashboardService();

/**
 * Get complete dashboard data
 * GET /lecturer/dashboard
 */
export const getDashboardData = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const userId = req.user?.id;

    const dashboardData = await dashboardService.getDashboardData(userId);

    return res.status(200).json({
      success: true,
      message: "Dashboard data retrieved successfully",
      data: dashboardData,
    });
  } catch (error) {
    console.error("Error getting dashboard data:", error);

    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        error: "USER_NOT_FOUND",
        message: "User tidak ditemukan",
      });
    }

    if (error instanceof Error && error.message === "USER_IS_NOT_LECTURER") {
      return res.status(403).json({
        success: false,
        error: "FORBIDDEN",
        message: "User bukan dosen",
      });
    }

    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Terjadi kesalahan saat mengambil data dashboard",
    });
  }
};

/**
 * Get dashboard statistics
 * GET /lecturer/dashboard/stats
 */
export const getDashboardStats = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "UNAUTHORIZED",
        message: "User tidak teridentifikasi",
      });
    }

    const stats = await dashboardService.getDashboardStats(userId);

    return res.status(200).json({
      success: true,
      message: "Dashboard stats retrieved successfully",
      data: stats,
    });
  } catch (error) {
    console.error("Error getting dashboard stats:", error);

    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        error: "USER_NOT_FOUND",
        message: "User tidak ditemukan",
      });
    }

    if (error instanceof Error && error.message === "USER_IS_NOT_LECTURER") {
      return res.status(403).json({
        success: false,
        error: "FORBIDDEN",
        message: "User bukan dosen",
      });
    }

    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Terjadi kesalahan saat mengambil data statistik",
    });
  }
};

/**
 * Get upcoming schedules
 * GET /lecturer/dashboard/schedules
 */
export const getUpcomingSchedules = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const userId = req.user?.id;
    const { limit = "10", status, jenis } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "UNAUTHORIZED",
        message: "User tidak teridentifikasi",
      });
    }

    const parsedLimit = Math.min(parseInt(limit as string) || 10, 50);

    const schedules = await dashboardService.getUpcomingSchedules(
      userId,
      parsedLimit,
      status as string | undefined,
      jenis as string | undefined
    );

    return res.status(200).json({
      success: true,
      message: "Upcoming schedules retrieved successfully",
      data: schedules,
    });
  } catch (error) {
    console.error("Error getting upcoming schedules:", error);

    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        error: "USER_NOT_FOUND",
        message: "User tidak ditemukan",
      });
    }

    if (error instanceof Error && error.message === "USER_IS_NOT_LECTURER") {
      return res.status(403).json({
        success: false,
        error: "FORBIDDEN",
        message: "User bukan dosen",
      });
    }

    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Terjadi kesalahan saat mengambil jadwal sidang",
    });
  }
};

/**
 * Get guided students
 * GET /lecturer/dashboard/students
 */
export const getGuidedStudents = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const userId = req.user?.id;
    const { status, jenis, limit = "50", offset = "0" } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "UNAUTHORIZED",
        message: "User tidak teridentifikasi",
      });
    }

    const parsedLimit = Math.min(parseInt(limit as string) || 50, 50);
    const parsedOffset = Math.max(parseInt(offset as string) || 0, 0);

    const students = await dashboardService.getGuidedStudents(
      userId,
      status as string | undefined,
      jenis as string | undefined,
      parsedLimit,
      parsedOffset
    );

    return res.status(200).json({
      success: true,
      message: "Guided students retrieved successfully",
      data: students,
    });
  } catch (error) {
    console.error("Error getting guided students:", error);

    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        error: "USER_NOT_FOUND",
        message: "User tidak ditemukan",
      });
    }

    if (error instanceof Error && error.message === "USER_IS_NOT_LECTURER") {
      return res.status(403).json({
        success: false,
        error: "FORBIDDEN",
        message: "User bukan dosen",
      });
    }

    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Terjadi kesalahan saat mengambil data mahasiswa bimbingan",
    });
  }
};

/**
 * Get guided students summary
 * GET /lecturer/dashboard/students/summary
 */
export const getGuidedStudentsSummary = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "UNAUTHORIZED",
        message: "User tidak teridentifikasi",
      });
    }

    const summary = await dashboardService.getGuidedStudentsSummary(userId);

    return res.status(200).json({
      success: true,
      message: "Guided students summary retrieved successfully",
      data: summary,
    });
  } catch (error) {
    console.error("Error getting guided students summary:", error);

    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        error: "USER_NOT_FOUND",
        message: "User tidak ditemukan",
      });
    }

    if (error instanceof Error && error.message === "USER_IS_NOT_LECTURER") {
      return res.status(403).json({
        success: false,
        error: "FORBIDDEN",
        message: "User bukan dosen",
      });
    }

    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Terjadi kesalahan saat mengambil ringkasan mahasiswa",
    });
  }
};

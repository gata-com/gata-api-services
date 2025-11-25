import { Request, Response } from "express";
import { StudentDashboardService } from "@/services/student/studentDashboardService";
import { AuthRequest } from "@/types";

const dashboardService = new StudentDashboardService();

/**
 * Get complete dashboard data
 * GET /mahasiswa/dashboard
 */
export const getDashboardData = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "User tidak teridentifikasi",
        data: null,
        errors: { auth: ["User not authenticated"] },
        status: 401,
      });
    }

    const dashboardData = await dashboardService.getDashboardData(userId);

    return res.status(200).json({
      message: "Dashboard data retrieved successfully",
      data: dashboardData,
      status: 200,
    });
  } catch (error) {
    console.error("Error getting dashboard data:", error);

    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        message: "User tidak ditemukan",
        data: null,
        errors: { resource: ["User tidak ditemukan"] },
        status: 404,
      });
    }

    if (error instanceof Error && error.message === "USER_IS_NOT_STUDENT") {
      return res.status(403).json({
        message: "User bukan mahasiswa",
        data: null,
        errors: { auth: ["User bukan mahasiswa"] },
        status: 403,
      });
    }

    return res.status(500).json({
      message: "Terjadi kesalahan saat mengambil data dashboard",
      data: null,
      errors: { server: ["Internal server error"] },
      status: 500,
    });
  }
};

/**
 * Get student profile
 * GET /mahasiswa/profile
 */
export const getProfile = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "User tidak teridentifikasi",
        data: null,
        errors: { auth: ["User not authenticated"] },
        status: 401,
      });
    }

    const profile = await dashboardService.getProfile(userId);

    return res.status(200).json({
      message: "Profile retrieved successfully",
      data: profile,
      status: 200,
    });
  } catch (error) {
    console.error("Error getting profile:", error);

    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        message: "User tidak ditemukan",
        data: null,
        errors: { resource: ["User tidak ditemukan"] },
        status: 404,
      });
    }

    if (error instanceof Error && error.message === "USER_IS_NOT_STUDENT") {
      return res.status(403).json({
        message: "User bukan mahasiswa",
        data: null,
        errors: { auth: ["User bukan mahasiswa"] },
        status: 403,
      });
    }

    return res.status(500).json({
      message: "Terjadi kesalahan saat mengambil profil",
      data: null,
      errors: { server: ["Internal server error"] },
      status: 500,
    });
  }
};

/**
 * Get guidance progress
 * GET /mahasiswa/guidance-progress
 */
export const getGuidanceProgress = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "User tidak teridentifikasi",
        data: null,
        errors: { auth: ["User not authenticated"] },
        status: 401,
      });
    }

    const guidanceProgress = await dashboardService.getGuidanceProgress(userId);

    return res.status(200).json({
      message: "Guidance progress retrieved successfully",
      data: guidanceProgress,
      status: 200,
    });
  } catch (error) {
    console.error("Error getting guidance progress:", error);

    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        message: "User tidak ditemukan",
        data: null,
        errors: { resource: ["User tidak ditemukan"] },
        status: 404,
      });
    }

    if (error instanceof Error && error.message === "USER_IS_NOT_STUDENT") {
      return res.status(403).json({
        message: "User bukan mahasiswa",
        data: null,
        errors: { auth: ["User bukan mahasiswa"] },
        status: 403,
      });
    }

    return res.status(500).json({
      message: "Terjadi kesalahan saat mengambil progress bimbingan",
      data: null,
      errors: { server: ["Internal server error"] },
      status: 500,
    });
  }
};

/**
 * Get timeline
 * GET /mahasiswa/timeline
 */
export const getTimeline = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "User tidak teridentifikasi",
        data: null,
        errors: { auth: ["User not authenticated"] },
        status: 401,
      });
    }

    const timeline = await dashboardService.getTimeline(userId);

    return res.status(200).json({
      message: "Timeline retrieved successfully",
      data: timeline,
      status: 200,
    });
  } catch (error) {
    console.error("Error getting timeline:", error);

    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        message: "User tidak ditemukan",
        data: null,
        errors: { resource: ["User tidak ditemukan"] },
        status: 404,
      });
    }

    if (error instanceof Error && error.message === "USER_IS_NOT_STUDENT") {
      return res.status(403).json({
        message: "User bukan mahasiswa",
        data: null,
        errors: { auth: ["User bukan mahasiswa"] },
        status: 403,
      });
    }

    return res.status(500).json({
      message: "Terjadi kesalahan saat mengambil timeline",
      data: null,
      errors: { server: ["Internal server error"] },
      status: 500,
    });
  }
};

/**
 * Get upcoming activities
 * GET /mahasiswa/upcoming-activities
 */
export const getUpcomingActivities = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user?.id;
    const { days = "7", limit = "5" } = req.query;

    if (!userId) {
      return res.status(401).json({
        message: "User tidak teridentifikasi",
        data: null,
        errors: { auth: ["User not authenticated"] },
        status: 401,
      });
    }

    const parsedDays = Math.min(parseInt(days as string) || 7, 365);
    const parsedLimit = Math.min(parseInt(limit as string) || 5, 50);

    const activities = await dashboardService.getUpcomingActivities(
      userId,
      parsedDays
    );

    return res.status(200).json({
      message: "Upcoming activities retrieved successfully",
      data: activities.slice(0, parsedLimit),
      status: 200,
    });
  } catch (error) {
    console.error("Error getting upcoming activities:", error);

    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        message: "User tidak ditemukan",
        data: null,
        errors: { resource: ["User tidak ditemukan"] },
        status: 404,
      });
    }

    if (error instanceof Error && error.message === "USER_IS_NOT_STUDENT") {
      return res.status(403).json({
        message: "User bukan mahasiswa",
        data: null,
        errors: { auth: ["User bukan mahasiswa"] },
        status: 403,
      });
    }

    return res.status(500).json({
      message: "Terjadi kesalahan saat mengambil aktivitas mendatang",
      data: null,
      errors: { server: ["Internal server error"] },
      status: 500,
    });
  }
};

/**
 * Get announcements
 * GET /mahasiswa/announcements
 */
export const getAnnouncements = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user?.id;
    const { page = "1", limit = "10", recent = "false" } = req.query;

    if (!userId) {
      return res.status(401).json({
        message: "User tidak teridentifikasi",
        data: null,
        errors: { auth: ["User not authenticated"] },
        status: 401,
      });
    }

    const parsedPage = Math.max(parseInt(page as string) || 1, 1);
    const parsedLimit = Math.min(parseInt(limit as string) || 10, 50);
    const isRecent = recent === "true";

    const result = await dashboardService.getAnnouncements(
      userId,
      parsedPage,
      parsedLimit,
      isRecent
    );

    const response: any = {
      message: "Announcements retrieved successfully",
      data: result.data,
      status: 200,
    };

    if ("pagination" in result && result.pagination) {
      response.pagination = (result as any).pagination;
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error getting announcements:", error);

    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        message: "User tidak ditemukan",
        data: null,
        errors: { resource: ["User tidak ditemukan"] },
        status: 404,
      });
    }

    if (error instanceof Error && error.message === "USER_IS_NOT_STUDENT") {
      return res.status(403).json({
        message: "User bukan mahasiswa",
        data: null,
        errors: { auth: ["User bukan mahasiswa"] },
        status: 403,
      });
    }

    return res.status(500).json({
      message: "Terjadi kesalahan saat mengambil pengumuman",
      data: null,
      errors: { server: ["Internal server error"] },
      status: 500,
    });
  }
};

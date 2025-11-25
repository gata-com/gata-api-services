import { Router } from "express";
import {
  getDashboardData,
  getDashboardStats,
  getUpcomingSchedules,
  getGuidedStudents,
  getGuidedStudentsSummary,
} from "@/controllers/lecturer/dashboard/dashboardController";
import { auth } from "@/middleware/auth";
import { requireLecturer } from "@/middleware/role";

const router = Router();

// ========== DASHBOARD ROUTES ==========

/**
 * GET /lecturer/dashboard
 * Get complete dashboard data
 */
router.get("/", getDashboardData);

/**
 * GET /lecturer/dashboard/stats
 * Get dashboard statistics only
 */
router.get("/stats", getDashboardStats);

/**
 * GET /lecturer/dashboard/schedules
 * Get upcoming schedules
 * Query: limit, status, jenis
 */
router.get("/schedules", getUpcomingSchedules);

/**
 * GET /lecturer/dashboard/students
 * Get guided students
 * Query: status, jenis, limit, offset
 */
router.get("/students", getGuidedStudents);

/**
 * GET /lecturer/dashboard/students/summary
 * Get guided students summary
 */
router.get("/students/summary", getGuidedStudentsSummary);

export default router;

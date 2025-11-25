import { Router } from "express";
import * as dashboardController from "@/controllers/student/dashboard/dashboardController";

const router = Router();

// GET /mahasiswa/dashboard - Complete dashboard data
router.get("/", dashboardController.getDashboardData);

// GET /mahasiswa/profile - Student profile only
router.get("/profile", dashboardController.getProfile);

// GET /mahasiswa/guidance-progress - Guidance progress for all supervisors
router.get("/guidance-progress", dashboardController.getGuidanceProgress);

// GET /mahasiswa/timeline - Timeline/milestones
router.get("/timeline", dashboardController.getTimeline);

// GET /mahasiswa/upcoming-activities - Upcoming activities with query params
router.get("/upcoming-activities", dashboardController.getUpcomingActivities);

// GET /mahasiswa/announcements - Announcements with pagination
router.get("/announcements", dashboardController.getAnnouncements);

export default router;

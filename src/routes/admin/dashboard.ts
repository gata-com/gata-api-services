import { Router } from "express";
import {
  getDashboardStats,
  getSystemStatus,
  getQuickStats,
  getPeriodeInfo,
  getDosenVerificationStatus,
  getJadwalSidangStatus,
  getRecentAnnouncements,
} from "@/controllers/admin/dashboard/dashboardController";

const router = Router();

// ========== DASHBOARD ROUTES ==========

/**
 * GET /admin/dashboard/stats
 * Get admin dashboard statistics
 * Query: semester, tahun_akademik (opsional)
 */
router.get("/stats", getDashboardStats);

/**
 * GET /admin/dashboard/system-status
 * Get system status overview (API server, database, storage)
 */
router.get("/system-status", getSystemStatus);

/**
 * GET /admin/dashboard/quick-stats/:category
 * Get quick stats by category
 * Categories: mahasiswa_baru, dosen_aktif, sidang_selesai, sidang_terjadwal
 */
router.get("/quick-stats/:category", getQuickStats);

/**
 * GET /admin/dashboard/periode-info
 * Get periode akademik information
 */
router.get("/periode-info", getPeriodeInfo);

/**
 * GET /admin/dashboard/dosen-verification-status
 * Get dosen verification status
 */
router.get("/dosen-verification-status", getDosenVerificationStatus);

/**
 * GET /admin/dashboard/jadwal-sidang-status
 * Get jadwal sidang status
 * Query: minggu_depan (boolean), bulan (1-12) (opsional)
 */
router.get("/jadwal-sidang-status", getJadwalSidangStatus);

/**
 * GET /admin/dashboard/pengumuman-terbaru
 * Get recent announcements
 * Query: limit (default: 2, max: 10)
 */
router.get("/pengumuman-terbaru", getRecentAnnouncements);

export default router;

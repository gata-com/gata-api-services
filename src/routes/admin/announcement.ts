import { Router } from "express";
import {
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "@/controllers/admin/announcement/announcementController";
import { auth } from "@/middleware/auth";
import { requireAdmin } from "@/middleware/role";
import {
  validateCreateAnnouncement,
  validateUpdateAnnouncement,
} from "@/middleware/validation/admin/announcement";

const router = Router();

// ========== ANNOUNCEMENT ROUTES ==========

/**
 * GET /admin/pengumuman
 * Get all announcements with pagination and filtering
 * Query params: page, limit, is_published, priority, search
 */
router.get("/", getAllAnnouncements);

/**
 * GET /admin/pengumuman/:id
 * Get announcement by ID
 */
router.get("/:id", getAnnouncementById);

/**
 * POST /admin/pengumuman
 * Create new announcement
 * Body: title, content, priority, is_published?
 */
router.post("/", validateCreateAnnouncement, createAnnouncement);

/**
 * PUT /admin/pengumuman/:id
 * Update announcement
 * Body: title?, content?, priority?, is_published?
 */
router.put("/:id", validateUpdateAnnouncement, updateAnnouncement);

/**
 * DELETE /admin/pengumuman/:id
 * Delete announcement
 */
router.delete("/:id", deleteAnnouncement);

export default router;

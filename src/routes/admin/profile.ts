import { Router } from "express";
import {
  getAdminProfile,
  updateAdminProfile,
  getAllExpertisesGroups,
} from "@/controllers/admin/adminProfileController";
import { auth } from "@/middleware/auth";
import { requireAdmin } from "@/middleware/role";

const router = Router();

// Apply auth and admin role middleware to all routes
router.use(auth);

/**
 * GET /admin/profile
 * Get admin profile
 */
router.get("/", getAdminProfile);

/**
 * PUT /admin/profile
 * Update admin profile
 * Body: name?, email?, whatsapp_number?, password?
 */
router.put("/", updateAdminProfile);

/**
 * GET /admin/profile/expertises-groups
 * Get all expertises groups (for input selection)
 */
router.get("/kelompok-keahlian", getAllExpertisesGroups);

export default router;

import { Router } from "express";
import {
  getAdminProfile,
  updateAdminProfile,
  getAllExpertisesGroups,
} from "@/controllers/admin/adminProfileController";
import { auth } from "@/middleware/auth";

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
 * Body: name, email, nip, initials, whatsapp_number?, password?, expertise_group_1, expertise_group_2, expertise_group_3, expertise_group_4, signature_data?
 */
router.put("/", updateAdminProfile);

/**
 * GET /admin/profile/kelompok-keahlian
 * Get all expertises groups (for input selection)
 */
router.get("/kelompok-keahlian", getAllExpertisesGroups);

export default router;

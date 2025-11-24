import { Router } from "express";
import {
  getLecturerProfile,
  updateLecturerProfile,
  getAllExpertisesGroups,
} from "@/controllers/lecturer/lecturerProfileController";
import { auth } from "@/middleware/auth";
import { requireLecturer } from "@/middleware/role";

const router = Router();

// Apply auth and lecturer role middleware to all routes
router.use(auth);
router.use(requireLecturer);

/**
 * GET /lecturer/profile
 * Get lecturer profile
 */
router.get("/", getLecturerProfile);

/**
 * PUT /lecturer/profile
 * Update lecturer profile
 * Body: name?, email?, whatsapp_number?, password?
 */
router.put("/", updateLecturerProfile);

/**
 * GET /lecturer/profile/expertises-groups
 * Get all expertises groups (for input selection)
 */
router.get("/kelompok-keahlian", getAllExpertisesGroups);

export default router;

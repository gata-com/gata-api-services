import { Router } from "express";
import {
  getLecturerProfile,
  updateLecturerProfile,
  getAllExpertisesGroups,
} from "@/controllers/lecturer/lecturerProfileController";


const router = Router();

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

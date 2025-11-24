import { Router } from "express";
import {
  getProfile,
  updateProfile,
} from "@/controllers/student/profileController";
import { auth } from "@/middleware/auth";
import { requireStudent } from "@/middleware/role";

const router = Router();

// Apply auth and student role middleware to all routes
router.use(auth);
router.use(requireStudent);

/**
 * GET /student/profile
 * Get student profile
 */
router.get("/", getProfile);

/**
 * PUT /student/profile
 * Update student profile
 * Body: name?, nim?, email?, whatsapp_number?, password?
 */
router.put("/", updateProfile);

export default router;

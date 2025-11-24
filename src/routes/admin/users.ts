import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "@/controllers/admin/userController";
import { auth } from "@/middleware/auth";
import { requireAdmin } from "@/middleware/role";

import { validateAdminCreateUser } from "@/middleware/validation/admin/users";

const router = Router();

// Apply auth and admin role middleware to all routes
router.use(auth);
router.use(requireAdmin);

// ========== USER ROUTES ==========

/**
 * GET /admin/users
 * Get all users with pagination and filtering
 * Query params: page, limit, role, is_active, search
 */
router.get("/", getAllUsers);

/**
 * GET /admin/users/:id
 * Get user by ID
 */
router.get("/:id", getUserById);

/**
 * POST /admin/users
 * Create new user
 * Body: name, email, password, role, whatsapp_number?, is_active?
 */
router.post("/", validateAdminCreateUser, createUser);

/**
 * PUT /admin/users/:id
 * Update user
 * Body: name?, email?, password?, whatsapp_number?, is_active?
 */
router.put("/:id", updateUser);

/**
 * DELETE /admin/users/:id
 * Delete user (soft delete)
 */
router.delete("/:id", deleteUser);

export default router;

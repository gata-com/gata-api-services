import { Router } from "express";
import passport from "../config/google";

// Controller imports
import { register } from "../controllers/auth/register";
import { login } from "../controllers/auth/login";
import { logout } from "../controllers/auth/logout";
import { forgotPassword } from "../controllers/auth/forgotPassword";
import { resetPassword } from "../controllers/auth/resetPassword";
import { getProfile } from "../controllers/auth/getProfileMahasiswa";
import { refreshToken } from "../controllers/auth/refreshToken";
import { verifyResetToken } from "../controllers/auth/verifyResetToken";
import {
  googleAuthCallback,
  getProfile as getGoogleProfile,
} from "../controllers/auth/googleController";

// Middleware imports
import { auth } from "../middleware/auth";
import { authenticateToken } from "../middleware/auth";
import { requireStudent, requireLecturer } from "@/middleware/role";

import {
  validateRegister,
  validateLogin,
  forgotPasswordValidation,
  resetPasswordValidation,
} from "../middleware/validation/auth";
import { handleValidationErrors } from "../middleware/validation/handleErrors";

const router: Router = Router();

// ============Google OAuth routes============
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  googleAuthCallback
);

// ============Standard Auth routes============
router.post("/register", validateRegister, handleValidationErrors, register);
router.post("/login", validateLogin, handleValidationErrors, login);

// Reset password routes
router.post(
  "/forgot-password",
  forgotPasswordValidation,
  handleValidationErrors,
  forgotPassword
);
router.post("/reset-password/:token", verifyResetToken);
router.post(
  "/reset-password",
  resetPasswordValidation,
  handleValidationErrors,
  resetPassword
);

//============ Protected Routes ============
router.post("/logout", logout);

router.get("/profile", authenticateToken, getGoogleProfile);

router.get("/profile", auth, getProfile);
router.post("/refresh", auth, refreshToken);

//============ Protected Routes using Role ============
router.get(
  "/mahasiswa/dashboard",
  authenticateToken,
  requireStudent,
  (req: any, res: any) => {
    res.json({ message: "Mahasiswa dashboard" });
  }
);

router.get(
  "/dosen/dashboard",
  authenticateToken,
  requireLecturer,
  (req: any, res: any) => {
    res.json({ message: "Dosen dashboard" });
  }
);

export default router;

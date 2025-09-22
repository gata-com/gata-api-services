import { Router } from "express";
import passport from "../config/google";

// Controller imports
import { registerStudent } from "../controllers/auth/register";
import { login } from "../controllers/auth/login";
import { forgotPassword } from "../controllers/auth/forgotPassword";
import { resetPassword } from "../controllers/auth/resetPassword";
import { getProfile } from "../controllers/auth/getProfileMahasiswa";
import { refreshToken } from "../controllers/auth/refreshToken";
import { verifyResetToken } from "../controllers/auth/verifyResetToken";
import {
  googleAuthCallback,
  getProfile as getGoogleProfile,
  logout,
} from "../controllers/auth/googleController";

// Middleware imports
import {
  validateRegister,
  validateLogin,
} from "../middleware/validation/validation";
import { handleValidationErrors } from "../middleware/validation/handleErrors";
import {
  forgotPasswordValidation,
  resetPasswordValidation,
  verifyTokenValidation,
} from "../middleware/resetPasswordValidation";
import { auth } from "../middleware/auth";
import { authenticateToken } from "../middleware/auth";
import {
  requireStudent,
  requireLecturer,
  requireAdmin,
  requireLecturerOrAdmin,
} from "@/middleware/role";

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

//============ Protected Routes ============
router.get("/profile", authenticateToken, getGoogleProfile);
router.post("/logout", authenticateToken, logout);

//============ Protected Routes using Role ============
router.get(
  "/mahasiswa/dashboard",
  authenticateToken,
  requireStudent,
  (req, res) => {
    res.json({ message: "Mahasiswa dashboard" });
  }
);

router.get(
  "/dosen/dashboard",
  authenticateToken,
  requireLecturer,
  (req, res) => {
    res.json({ message: "Dosen dashboard" });
  }
);

// Basic routes
router.post(
  "/register",
  validateRegister,
  // handleValidationErrors,
  registerStudent
);
router.post(
  "/login",
  validateLogin,
  // handleValidationErrors,
  login
);
router.get("/profile", auth, getProfile);
router.post("/refresh", auth, refreshToken);

// // Reset password routes
router.post("/forgot-password", forgotPasswordValidation, forgotPassword);
router.get("/reset-password/:token", verifyTokenValidation, verifyResetToken);
router.post("/reset-password", /* resetPasswordValidation, */ resetPassword);

// Test route untuk debug
router.get("/test", (req, res) => {
  res.json({
    message: "Auth routes working!",
    routes: [
      "POST /register",
      "POST /login",
      "GET /profile",
      "POST /refresh",
      "POST /forgot-password",
      "GET /reset-password/:token",
      "POST /reset-password",
    ],
  });
});

export default router;

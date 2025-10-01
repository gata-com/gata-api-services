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

// ============Standard Auth routes============
router.post(
  "/register",
  // validateRegister,
  // handleValidationErrors,
  register
);
router.post(
  "/login",
  // validateLogin,
  // handleValidationErrors,
  login
);

// Reset password routes
router.post(
  "/forgot-password",
  // forgotPasswordValidation,
  forgotPassword
);
router.post(
  "/reset-password/:token",
  // verifyTokenValidation,
  verifyResetToken
);
router.post("/reset-password", /* resetPasswordValidation, */ resetPassword);

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

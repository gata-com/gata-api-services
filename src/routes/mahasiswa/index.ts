import { Router } from "express";
import tugasAkhir from "./tugasAkhir";
import profileRoutes from "./profile";
import { requireStudent } from "@/middleware/role";
import { auth } from "../../middleware/auth";

const router = Router();

// Semua route memerlukan authentication
router.use(auth);

// Mahasiswa routes
router.use("/tugas-akhir", requireStudent, tugasAkhir);

// Profile routes
router.use("/profile", requireStudent, profileRoutes);

export default router;

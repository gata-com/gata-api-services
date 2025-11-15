import { Router } from "express";
import tugasAkhir from "./finalProject";
import profileRoutes from "./profile";
import bimbingan from "./guidance";
import { requireStudent } from "@/middleware/role";
import { auth } from "@/middleware/auth";

const router = Router();

// Semua route memerlukan authentication
router.use(auth);

router.use("/tugas-akhir", requireStudent, tugasAkhir);
router.use("/bimbingan", requireStudent, bimbingan);

router.use("/profile", requireStudent, profileRoutes);

export default router;

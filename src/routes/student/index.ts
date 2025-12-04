import { Router } from "express";
import tugasAkhir from "./finalProject";
import profileRoutes from "./profile";
import bimbingan from "./guidance";
import dashboard from "./dashboard";
import hasilSidang from "./hasilsidang";
import { requireStudent } from "@/middleware/role";
import { auth } from "@/middleware/auth";

const router = Router();

// Semua route memerlukan authentication
router.use(auth);

router.use("/dashboard", requireStudent, dashboard);
router.use("/tugas-akhir", requireStudent, tugasAkhir);
router.use("/bimbingan", requireStudent, bimbingan);

router.use("/profile", requireStudent, profileRoutes);
router.use("/hasil-sidang", requireStudent, hasilSidang);

export default router;

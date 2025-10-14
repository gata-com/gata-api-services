import { Router } from "express";
import tugasAkhir from "./tugasAkhir";
import { auth } from "@/middleware/auth";
import { requireAdmin } from "@/middleware/role";
import { getCurrentPeriod } from "@/controllers/admin/tugasAkhir/createFinalProjectPeriod";

const router = Router();

// Semua route memerlukan authentication
router.use(auth);

// tidak perlu admin untuk melihat periode
router.get("/tugas-akhir/periode", getCurrentPeriod);

// Tugas Akhir routes
router.use("/tugas-akhir", requireAdmin, tugasAkhir);

export default router;

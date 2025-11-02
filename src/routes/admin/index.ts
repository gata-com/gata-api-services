import { Router } from "express";
import tugasAkhir from "./tugasAkhir";
import { auth } from "@/middleware/auth";
import { requireAdmin } from "@/middleware/role";


const router = Router();

// Semua route memerlukan authentication
router.use(auth);

// Tugas Akhir routes
router.use("/tugas-akhir", requireAdmin, tugasAkhir);

export default router;

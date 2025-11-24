import { Router } from "express";
import tugasAkhir from "./finalProject";
import penilaian from "./penilaian";
import sidang from "./defense";
import users from "./users";
import { auth } from "@/middleware/auth";
import { requireAdmin } from "@/middleware/role";

import { getSchedule } from "@/controllers/admin/defense/getSchedule";

const router = Router();

// Semua route memerlukan authentication
router.use(auth);

// Users routes
router.use("/users", requireAdmin, users);

// Tugas Akhir routes
router.use("/tugas-akhir", requireAdmin, tugasAkhir);

// Penilaian routes
router.use("/penilaian", requireAdmin, penilaian);

// Sidang routes
router.use("/defense", requireAdmin, sidang);

// jadwal sidang route
router.get("/jadwal-sidang", getSchedule);

export default router;

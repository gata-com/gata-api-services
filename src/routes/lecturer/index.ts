import { Router } from "express";
import tugasAkhir from "./finalProject";
import bimbingan from "./guidance";
import penilaian from "./penilaian";
import { requireLecturer, requireLecturerOrAdmin } from "@/middleware/role";
import { auth } from "@/middleware/auth";

const router = Router();

// Semua route memerlukan authentication
router.use(auth);

router.use("/tugas-akhir", requireLecturerOrAdmin, tugasAkhir);
router.use("/bimbingan", requireLecturerOrAdmin, bimbingan);
router.use("/penilaian", requireLecturerOrAdmin, penilaian);

export default router;

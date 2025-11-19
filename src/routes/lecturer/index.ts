import { Router } from "express";
import tugasAkhir from "./finalProject";
import bimbingan from "./guidance";
import penilaian from "./penilaian";
import { requireLecturer } from "@/middleware/role";
import { auth } from "@/middleware/auth";

const router = Router();

// Semua route memerlukan authentication
router.use(auth);

router.use("/tugas-akhir", requireLecturer, tugasAkhir);
router.use("/bimbingan", requireLecturer, bimbingan);
router.use("/penilaian", penilaian);

export default router;

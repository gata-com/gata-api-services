import { Router } from "express";
import tugasAkhir from "./tugasAkhir";
import { requireLecturer } from "@/middleware/role";
import { auth } from "@/middleware/auth";

const router = Router();

// Semua route memerlukan authentication
router.use(auth);

// Dosen routes
router.use("/tugas-akhir", requireLecturer, tugasAkhir);


export default router;

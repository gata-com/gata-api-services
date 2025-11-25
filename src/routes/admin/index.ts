import { Router } from "express";
import tugasAkhir from "./finalProject";
import penilaian from "./penilaian";
import sidang from "./defense";
import users from "./users";
import profile from "./profile";
import announcement from "./announcement";
import dashboard from "./dashboard";
import { auth } from "@/middleware/auth";
import { requireAdmin } from "@/middleware/role";

const router = Router();

// Semua route memerlukan authentication
router.use(auth);

// Dashboard routes
router.use("/dashboard", requireAdmin, dashboard);

// Users routes
router.use("/users", requireAdmin, users);

// Profile routes
router.use("/profile", requireAdmin, profile);

// Tugas Akhir routes
router.use("/tugas-akhir", requireAdmin, tugasAkhir);

// Penilaian routes
router.use("/penilaian", requireAdmin, penilaian);

// Sidang routes
router.use("/defense", requireAdmin, sidang);

// Announcement routes
router.use("/pengumuman", requireAdmin, announcement);

export default router;

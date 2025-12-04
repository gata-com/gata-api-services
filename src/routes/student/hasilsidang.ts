import { Router } from "express";
import {
  getHasilSidang,
  getHasilSidangList,
  downloadBAP,
} from "@/controllers/student/hasilSidang";

const router = Router();

/**
 * GET /mahasiswa/hasil-sidang
 * Mengambil daftar semua hasil sidang (untuk admin atau overview)
 */
router.get("/", getHasilSidangList);

/**
 * GET /mahasiswa/hasil-sidang/:userId/download-bap
 * Mengunduh file BAP (Berita Acara Pemeriksaan) yang sudah ditandatangani
 * Flow: userId → findByUserId → studentId → getBAPFile → stream
 */
router.get("/:userId/download-bap", downloadBAP);

/**
 * GET /mahasiswa/hasil-sidang/:userId
 * Mengambil data hasil sidang (BAP results) untuk mahasiswa tertentu
 * Flow: userId → findByUserId → studentId → getHasilSidangByStudentId
 */
router.get("/:userId", getHasilSidang);

export default router;

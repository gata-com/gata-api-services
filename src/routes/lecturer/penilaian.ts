import { Router } from "express";
import {
  getJadwalSidang,
  getJadwalDetail,
} from "@/controllers/lecturer/penilaian/jadwalController";
import {
  getPenilaian,
  submitPenilaian,
  getPenilaianDosen,
  getRekapNilai,
  getKomentarDosen,
  finalisasiNilai,
} from "@/controllers/lecturer/penilaian/penilaianController";
import { auth } from "@/middleware/auth";
import {
  validateSubmitPenilaian,
  validateFinalisasi,
} from "@/middleware/validation/lecturer/penilaian";

const router = Router();

// Apply auth and role middleware to all routes
router.use(auth);
// router.use(requireLecturer);

// ========== JADWAL ROUTES ==========
// GET /dosen/penilaian/jadwal - Get jadwal sidang
router.get("/jadwal", getJadwalSidang);

// GET /dosen/penilaian/jadwal/:jadwalId - Get jadwal detail
router.get("/jadwal/:jadwalId", getJadwalDetail);

// ========== PENILAIAN ROUTES ==========
router.get("/data-sidang/:userId", getPenilaian);

// POST /dosen/penilaian/jadwal/:jadwalId/nilai - Submit penilaian
router.post(
  "/jadwal/:jadwalId/nilai",
  validateSubmitPenilaian,
  submitPenilaian
);

// GET /dosen/penilaian/jadwal/:jadwalId/nilai - Get penilaian dosen
router.get("/jadwal/:jadwalId/nilai", getPenilaianDosen);

// GET /dosen/penilaian/jadwal/:jadwalId/rekap - Get rekap nilai
router.get("/jadwal/:jadwalId/rekap", getRekapNilai);

// GET /dosen/penilaian/jadwal/:jadwalId/komentar - Get komentar dosen
router.get("/jadwal/:jadwalId/komentar", getKomentarDosen);

// POST /dosen/penilaian/jadwal/:jadwalId/finalisasi - Finalisasi nilai
router.post(
  "/jadwal/:jadwalId/finalisasi",
  validateFinalisasi,
  finalisasiNilai
);

export default router;

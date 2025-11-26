import { Router } from "express";
import {
  getJadwalSidang,
  getJadwalDetail,
} from "@/controllers/lecturer/penilaian/jadwalController";
import {
  getPenilaian,
  finalisasiNilai,
  savePenilaian,
  updateNilai,
} from "@/controllers/lecturer/penilaian/penilaianController";
import { auth } from "@/middleware/auth";
import {
  validateSubmitPenilaian,
  validateFinalisasi,
  validateSavePenilaian,
  validateUpdateNilai,
  handleValidationErrors,
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

// POST /dosen/penilaian/simpan-nilai - Save/submit penilaian (NEW ENDPOINT)
router.post("/simpan-nilai", validateSavePenilaian, savePenilaian);

// POST /dosen/penilaian/update-nilai - Update penilaian (NEW ENDPOINT)
router.post("/update-nilai", validateUpdateNilai, updateNilai);

// POST /dosen/penilaian/jadwal/:jadwalId/finalisasi - Finalisasi nilai
router.post(
  "/jadwal/:jadwalId/finalisasi",
  // validateFinalisasi,
  // handleValidationErrors,
  finalisasiNilai
);

// ========== BAP PDF ROUTES ==========
import {
  generateBapPdf,
  downloadBapByStudent,
  downloadBapByName,
  getBapInfo,
} from "@/controllers/admin/penilaian/bapPdfController";

// POST /lecturer/penilaian/jadwal/:jadwalId/student/:studentId/generate-bap-pdf
router.post(
  "/jadwal/:jadwalId/student/:studentId/generate-bap-pdf",
  generateBapPdf
);

// GET /lecturer/penilaian/student/:studentId/bap
router.get("/student/:studentId/bap", getBapInfo);

// GET /lecturer/penilaian/student/:studentId/bap/download
router.get("/student/:studentId/bap/download", downloadBapByStudent);

// GET /lecturer/penilaian/bap/download/:pdfName
router.get("/bap/download/:pdfName", downloadBapByName);

export default router;

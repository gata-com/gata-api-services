import { Router } from "express";
import {
  getAllRubriks,
  getRubrikById,
  createRubrik,
  updateRubrik,
  deleteRubrik,
  duplicateRubrik,
  setDefaultRubrik,
  createGroup,
  updateGroup,
  deleteGroup,
  reorderGroups,
  setDefaultGroup,
  unsetDefaultGroup,
  createPertanyaan,
  updatePertanyaan,
  deletePertanyaan,
  duplicatePertanyaan,
  reorderPertanyaans,
  createOpsiJawaban,
  updateOpsiJawaban,
  deleteOpsiJawaban,
  bulkDeleteOpsiJawaban,
} from "@/controllers/admin/penilaian/rubrikController";
import {
  getAllRentangNilai,
  createRentangNilai,
  updateRentangNilai,
  deleteRentangNilai,
  bulkUpdateRentangNilai,
} from "@/controllers/admin/penilaian/rentangNilaiController";
import {
  viewAllPenilaians,
  generateBap,
  downloadBap,
  previewBap,
} from "@/controllers/admin/penilaian/penilaianViewController";
import {
  generateBapPdf,
  downloadBapByStudent,
  downloadBapByName,
  getBapInfo,
  getAllBap,
} from "@/controllers/admin/penilaian/bapPdfController";
import { auth } from "@/middleware/auth";
import { requireAdmin } from "@/middleware/role";
import {
  validateCreateRubrik,
  validateUpdateRubrik,
  validateCreateGroup,
  validateUpdateGroup,
  validateCreatePertanyaan,
  validateUpdatePertanyaan,
  validateCreateOpsi,
  validateUpdateOpsi,
  validateRentangNilai,
  validateUpdateRentangNilai,
} from "@/middleware/validation/admin/penilaian";

const router = Router();

// Apply auth and role middleware to all routes
router.use(auth);
router.use(requireAdmin);

// ========== RUBRIK ROUTES ==========
// GET /admin/penilaian/rubrik - Get all rubriks
router.get("/rubrik", getAllRubriks);

// GET /admin/penilaian/rubrik/:id - Get rubrik by ID
router.get("/rubrik/:id", getRubrikById);

// POST /admin/penilaian/rubrik - Create rubrik
router.post("/rubrik", validateCreateRubrik, createRubrik);

// PUT /admin/penilaian/rubrik/:id - Update rubrik
router.put("/rubrik/:id", validateUpdateRubrik, updateRubrik);

// DELETE /admin/penilaian/rubrik/:id - Delete rubrik
router.delete("/rubrik/:id", deleteRubrik);

// POST /admin/penilaian/rubrik/:id/duplicate - Duplicate rubrik
router.post("/rubrik/:id/duplicate", duplicateRubrik);

// POST /admin/penilaian/rubrik/:id/set-default - Set as default
router.post("/rubrik/:id/set-default", setDefaultRubrik);

// ========== RUBRIK GROUP ROUTES ==========
// POST /admin/penilaian/rubrik/:rubrikId/group - Create group
router.post("/rubrik/:rubrikId/group", validateCreateGroup, createGroup);

// PUT /admin/penilaian/group/:id - Update group
router.put("/group/:id", validateUpdateGroup, updateGroup);

// DELETE /admin/penilaian/group/:id - Delete group
router.delete("/group/:id", deleteGroup);

// POST /admin/penilaian/group/:groupId/set-default - Set group as default
router.post("/group/:groupId/set-default", setDefaultGroup);

// POST /admin/penilaian/group/:groupId/unset-default - Unset group as default
router.post("/group/:groupId/unset-default", unsetDefaultGroup);

// PUT /admin/penilaian/rubrik/:rubrikId/group/reorder - Reorder groups
router.put("/rubrik/:rubrikId/group/reorder", reorderGroups);

// ========== PERTANYAAN ROUTES ==========
// POST /admin/penilaian/group/:groupId/pertanyaan - Create pertanyaan
router.post(
  "/group/:groupId/pertanyaan",
  validateCreatePertanyaan,
  createPertanyaan
);

// PUT /admin/penilaian/pertanyaan/:id - Update pertanyaan
router.post("/pertanyaan/:id", validateUpdatePertanyaan, updatePertanyaan);

// DELETE /admin/penilaian/pertanyaan/:id - Delete pertanyaan
router.delete("/pertanyaan/:id", deletePertanyaan);

// POST /admin/penilaian/pertanyaan/:id/duplicate - Duplicate pertanyaan
router.post("/pertanyaan/:id/duplicate", duplicatePertanyaan);

// PUT /admin/penilaian/group/:groupId/pertanyaan/reorder - Reorder pertanyaans
router.put("/group/:groupId/pertanyaan/reorder", reorderPertanyaans);

// ========== OPSI JAWABAN ROUTES ==========
// POST /admin/penilaian/pertanyaan/:pertanyaanId/opsi - Create opsi
router.post(
  "/pertanyaan/:pertanyaanId/opsi",
  validateCreateOpsi,
  createOpsiJawaban
);

// PUT /admin/penilaian/opsi/:id - Update opsi
router.put("/opsi/:id", validateUpdateOpsi, updateOpsiJawaban);

// DELETE /admin/penilaian/opsi/:id - Delete opsi
router.delete("/opsi/:id", deleteOpsiJawaban);

// DELETE /admin/penilaian/pertanyaan/:pertanyaanId/opsi/bulk - Bulk delete
router.delete("/pertanyaan/:pertanyaanId/opsi/bulk", bulkDeleteOpsiJawaban);

// ========== RENTANG NILAI ROUTES ==========
// GET /admin/penilaian/rentang-nilai - Get all rentang nilai
router.get("/rentang-nilai", getAllRentangNilai);

// POST /admin/penilaian/rentang-nilai - Create rentang nilai
router.post("/rentang-nilai", validateRentangNilai, createRentangNilai);

// PUT /admin/penilaian/rentang-nilai/bulk - Bulk update rentang nilai
router.put("/rentang-nilai/bulk", bulkUpdateRentangNilai);

// PUT /admin/penilaian/rentang-nilai/:id - Update rentang nilai (id hanya angka)
router.put("/rentang-nilai/:id", validateRentangNilai, updateRentangNilai);

// DELETE /admin/penilaian/rentang-nilai/:id - Delete rentang nilai (id hanya angka)
router.delete("/rentang-nilai/:id", deleteRentangNilai);

// ========== PENILAIAN VIEW ROUTES ==========
// GET /admin/penilaian/view-dosen - View all penilaians
router.get("/view-dosen", viewAllPenilaians);

// POST /admin/penilaian/jadwal/:jadwalId/generate-bap - Generate BAP
router.post("/jadwal/:jadwalId/generate-bap", generateBap);

// GET /admin/penilaian/jadwal/:jadwalId/bap - Download BAP
router.get("/jadwal/:jadwalId/bap", downloadBap);

// GET /admin/penilaian/jadwal/:jadwalId/bap/preview - Preview BAP
router.get("/jadwal/:jadwalId/bap/preview", previewBap);

// ========== BAP PDF ROUTES (New Implementation) ==========
// POST /admin/penilaian/jadwal/:jadwalId/student/:studentId/generate-bap-pdf - Generate BAP PDF for student
router.post(
  "/jadwal/:jadwalId/student/:studentId/generate-bap-pdf",
  generateBapPdf
);

// GET /admin/penilaian/student/:studentId/bap - Get BAP info by student
router.get("/student/:studentId/bap", getBapInfo);

// GET /admin/penilaian/student/:studentId/bap/download - Download BAP by student
router.get("/student/:studentId/bap/download", downloadBapByStudent);

// GET /admin/penilaian/bap/download/:pdfName - Download BAP by filename
router.get("/bap/download/:pdfName", downloadBapByName);

// GET /admin/penilaian/bap/all - Get all BAP
router.get("/bap/all", getAllBap);

export default router;

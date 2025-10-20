import { Router } from "express";

import { getStudentByQuery } from "@/controllers/mahasiswa/tugasAkhir/getStudentByQuery";
import { getLecturer } from "@/controllers/mahasiswa/tugasAkhir/getLecturer";
import { create } from "@/controllers/mahasiswa/tugasAkhir/createFinalProject";
import { getHistoryByUserId } from "@/controllers/mahasiswa/tugasAkhir/getHistoryByUserId";

// Middleware imports
import upload from "../../middleware/upload";
import { validateCreateFinalProject } from "@/middleware/validation/mahasiswa";
import { handleValidationErrors } from "@/middleware/validation/handleErrors";

const router = Router();

router.get("/", getStudentByQuery);
router.get("/dosen", getLecturer);
router.get("/riwayat/:userId", getHistoryByUserId);

// Upload fields untuk multiple members, setiap member bisa punya draft_path dan dispen_path
// Gunakan .any() untuk menerima semua field dengan nama dinamis (draft_path_0, dispen_path_0, dll)'
router.post(
  "/daftar",
  upload.any(),
  validateCreateFinalProject,
  handleValidationErrors,
  create
);

export default router;

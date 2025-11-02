import { Router } from "express";

import { getStudentByQuery } from "@/controllers/mahasiswa/tugasAkhir/getStudentByQuery";
import { getLecturer } from "@/controllers/mahasiswa/tugasAkhir/getLecturer";
import { create } from "@/controllers/mahasiswa/tugasAkhir/createFinalProject";
import { getHistoryByUserId } from "@/controllers/mahasiswa/tugasAkhir/getHistoryByUserId";
import { getCurrentPeriod } from "@/controllers/mahasiswa/tugasAkhir/getCurrentPeriod";
import { changeSupervisor } from "@/controllers/mahasiswa/tugasAkhir/changeSupervisor";
import { deleteFP } from "@/controllers/mahasiswa/tugasAkhir/deleteFP";

// Middleware imports
import upload from "../../middleware/upload";
import { validateCreateFinalProject } from "@/middleware/validation/mahasiswa";
import { handleValidationErrors } from "@/middleware/validation/handleErrors";
import { validateFPChangeSupervisor } from "@/middleware/validation/mahasiswa";
import { validateFPDelete } from "@/middleware/validation/mahasiswa";

const router = Router();

router.get("/periode", getCurrentPeriod);

router.get("/", getStudentByQuery);
router.get("/dosen", getLecturer);
router.get("/riwayat/:userId", getHistoryByUserId);

router.post(
  "/ganti-dosen",
  validateFPChangeSupervisor,
  handleValidationErrors,
  changeSupervisor
);

router.delete("/hapus/:id", validateFPDelete, handleValidationErrors, deleteFP);

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

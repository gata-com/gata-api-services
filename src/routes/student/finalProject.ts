import { Router } from "express";

import { getStudentByQuery } from "@/controllers/student/finalProject/getStudentByQuery";
import { getLecturer } from "@/controllers/student/finalProject/getLecturer";
import { create } from "@/controllers/student/finalProject/createFinalProject";
import { getHistoryByUserId } from "@/controllers/student/finalProject/getHistoryByUserId";
import { getCurrentPeriod } from "@/controllers/student/finalProject/getCurrentPeriod";
import { changeSupervisor } from "@/controllers/student/finalProject/changeSupervisor";
import { deleteFP } from "@/controllers/student/finalProject/deleteFP";

// Middleware imports
import upload from "../../middleware/upload";
import { validateCreateFinalProject } from "@/middleware/validation/student";
import { handleValidationErrors } from "@/middleware/validation/handleErrors";
import { validateFPChangeSupervisor } from "@/middleware/validation/student";
import { validateFPDelete } from "@/middleware/validation/student";

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

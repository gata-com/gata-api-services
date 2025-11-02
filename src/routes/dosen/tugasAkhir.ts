import { Router } from "express";

import { getValidationData } from "@/controllers/dosen/tugasAkhir/getValidationData";
import { getValidationStats } from "@/controllers/dosen/tugasAkhir/getValidationStats";
import { approval } from "@/controllers/dosen/tugasAkhir/approval";
import { addSlot } from "@/controllers/dosen/tugasAkhir/addSlot";
import { getCurrentPeriodApproval } from "@/controllers/dosen/tugasAkhir/getCurrentPeriodApproval";
import {
  validateFPApproval,
  validateFPValidation,
  validateFPAddSlot,
} from "@/middleware/validation/dosen";
import { handleValidationErrors } from "@/middleware/validation/handleErrors";

const router = Router();

router.get("/periode", getCurrentPeriodApproval);

router.get(
  "/validasi-stats/:userId",
  validateFPValidation,
  handleValidationErrors,
  getValidationStats
);
router.get(
  "/validasi/:userId",
  validateFPValidation,
  handleValidationErrors,
  getValidationData
);

router.post(
  "/persetujuan",
  validateFPApproval,
  handleValidationErrors,
  approval
);

router.post("/tambah-slot", validateFPAddSlot, handleValidationErrors, addSlot);

export default router;

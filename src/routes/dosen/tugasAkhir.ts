import { Router } from "express";

import { getValidationData } from "@/controllers/dosen/tugasAkhir/getValidationData";
import { getValidationStats } from "@/controllers/dosen/tugasAkhir/getValidationStats";
import { approval } from "@/controllers/dosen/tugasAkhir/approval";
import {
  validateFPApproval,
  validateFPValidation,
} from "@/middleware/validation/dosen";
import { handleValidationErrors } from "@/middleware/validation/handleErrors";

const router = Router();

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

//
router.post(
  "/persetujuan",
  validateFPApproval,
  handleValidationErrors,
  approval
);

export default router;

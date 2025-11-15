import { Router } from "express";

import { getValidationData } from "@/controllers/lecturer/finalProject/getValidationData";
import { getValidationStats } from "@/controllers/lecturer/finalProject/getValidationStats";
import { approval } from "@/controllers/lecturer/finalProject/approval";
import { addSlot } from "@/controllers/lecturer/finalProject/addSlot";
import { getCurrentPeriodApproval } from "@/controllers/lecturer/finalProject/getCurrentPeriodApproval";

// Validation middlewares
import {
  validateFPApproval,
  validateFPValidation,
  validateFPAddSlot,
} from "@/middleware/validation/lecturer";
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

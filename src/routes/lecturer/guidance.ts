import { Router } from "express";

import { saveAvailability } from "@/controllers/lecturer/guidance/saveAvailability";
import { deleteAvailability } from "@/controllers/lecturer/guidance/deleteAvailability";
import { getAvailability } from "@/controllers/lecturer/guidance/getAvailability";
import { getDashboardData } from "@/controllers/lecturer/guidance/getDashboardData";
import { dashboardActions } from "@/controllers/lecturer/guidance/dashboardActions";
import { getDefenseSubmission } from "@/controllers/lecturer/guidance/getDefenseSubmission";
import { approvalDefenseSubmission } from "@/controllers/lecturer/guidance/approvalDefenseSubmission";
import { getTotalStudents } from "@/controllers/lecturer/guidance/getTotalStudents";

// validation middlewares
import {
  validateGA,
  validateGAAvailability,
  validateGuidanceDashboard,
  validateGuidaneActions,
  validateGADelete,
  validateDefenseSubmission,
  validateDefenseApproval,
  validateTotalStudents,
} from "@/middleware/validation/lecturer";
import { handleValidationErrors } from "@/middleware/validation/handleErrors";

const router = Router();

router.get(
  "/dashboard/:userId",
  validateGuidanceDashboard,
  handleValidationErrors,
  getDashboardData
);

router.post(
  "/action",
  validateGuidaneActions,
  handleValidationErrors,
  dashboardActions
);

router.get(
  "/total-mahasiswa/:userId",
  validateTotalStudents,
  handleValidationErrors,
  getTotalStudents
);

/**
 *  Ketersediaan Bimbingan Routes
 */
router.get(
  "/ketersediaan/:userId",
  validateGAAvailability,
  handleValidationErrors,
  getAvailability
);

router.post(
  "/ketersediaan",
  validateGA,
  handleValidationErrors,
  saveAvailability
);

router.delete(
  "/ketersediaan/:id",
  validateGADelete,
  handleValidationErrors,
  deleteAvailability
);

/**
 * Pengajuan Sidang Routes
 */

router.get(
  "/pengajuan-sidang/:userId",
  validateDefenseSubmission,
  handleValidationErrors,
  getDefenseSubmission
);

router.post(
  "/pengajuan-sidang/persetujuan",
  validateDefenseApproval,
  handleValidationErrors,
  approvalDefenseSubmission
);

export default router;

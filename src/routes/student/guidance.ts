import { Router } from "express";
import { getSupervisors } from "@/controllers/student/guidance/getSupervisors";
import { createSubmission } from "@/controllers/student/guidance/createSubmission";
import { getDashboardData } from "@/controllers/student/guidance/getDashboardData";
import { createSubmissionDefense } from "@/controllers/student/guidance/createSubmissionDefense";
import { getExpertisesGroup } from "@/controllers/student/guidance/getExpertisesGroup";
import { getFPMembers } from "@/controllers/student/guidance/getFPMembers";

// middleware
import {
  validateGetSupervisors,
  validateGSCreate,
  validateGuidanceDashboard,
  validateGuidanceDefenseCreate,
} from "@/middleware/validation/student";
import { handleValidationErrors } from "@/middleware/validation/handleErrors";

const router = Router();

router.get(
  "/dashboard/:userId",
  validateGuidanceDashboard,
  handleValidationErrors,
  getDashboardData
);

router.get(
  "/pembimbing/:userId",
  validateGetSupervisors,
  handleValidationErrors,
  getSupervisors
);

router.post(
  "/pengajuan",
  validateGSCreate,
  handleValidationErrors,
  createSubmission
);

router.post(
  "/pengajuan-sidang",
  validateGuidanceDefenseCreate,
  handleValidationErrors,
  createSubmissionDefense
);

router.get("/kelompok-keahlian", getExpertisesGroup);

router.get("/anggota-tugas-akhir/:userId", getFPMembers);

export default router;

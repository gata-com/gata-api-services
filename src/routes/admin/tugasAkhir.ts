import { Router } from "express";
import { create } from "@/controllers/admin/tugasAkhir/createFinalProjectPeriod";

// middleware
import { validateCreateFinalProjectPeriod } from "../../middleware/validation/admin";
import { handleValidationErrors } from "../../middleware/validation/handleErrors";

// controllers
import { getPengajuan } from "@/controllers/admin/tugasAkhir/getPengajuan";
import { getDosen } from "@/controllers/admin/tugasAkhir/getDosen";
import { getCurrentPeriodApproval } from "@/controllers/admin/tugasAkhir/getCurrentPeriodApproval";

const router = Router();

router.get("/periode", getCurrentPeriodApproval);

router.post(
  "/periode",
  validateCreateFinalProjectPeriod,
  handleValidationErrors,
  create
);

router.get("/dosen", getDosen);
router.get("/pengajuan", getPengajuan);

export default router;

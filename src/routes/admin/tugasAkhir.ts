import { Router } from "express";
import { create } from "@/controllers/admin/tugasAkhir/createFinalProjectPeriod";
import { validateCreateFinalProjectPeriod } from "../../middleware/validation/admin";
import { handleValidationErrors } from "../../middleware/validation/handleErrors";

const router = Router();

router.post(
  "/periode",
  validateCreateFinalProjectPeriod,
  handleValidationErrors,
  create
);

export default router;

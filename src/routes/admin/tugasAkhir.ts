import { Router } from "express";
import {
  create,
  getCurrentPeriod,
} from "@/controllers/admin/tugasAkhir/createFinalProjectPeriod";

const router = Router();

router.post("/periode", create);

export default router;

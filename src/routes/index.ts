import { Router } from "express";
import { getSchedule } from "@/controllers/getSchedule";

const router = Router();

router.get("/jadwal-sidang", getSchedule);

export default router;

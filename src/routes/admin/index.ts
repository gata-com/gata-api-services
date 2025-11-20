import { Router } from "express";
import multer from "multer";
import tugasAkhir from "./finalProject";
import penilaian from "./penilaian";
import { auth } from "@/middleware/auth";
import { requireAdmin } from "@/middleware/role";
import {
  exportDefenseToCSV,
  assignExaminers,
  importScheduleCSV,
} from "@/controllers/admin/defense/exportDefenseCsv";
import { getSchedule } from "@/controllers/admin/defense/getSchedule";

const router = Router();

// Configure multer for CSV file uploads
const csvStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "src/storages/schedules/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "schedule-" + uniqueSuffix + ".csv");
  },
});

const csvUpload = multer({
  storage: csvStorage,
  fileFilter: (req, file, cb) => {
    // Allow CSV files
    if (
      file.mimetype === "text/csv" ||
      file.originalname.toLowerCase().endsWith(".csv")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // Maximum 5MB per file
  },
});

// Semua route memerlukan authentication
router.use(auth);

// Tugas Akhir routes
router.use("/tugas-akhir", requireAdmin, tugasAkhir);

// Penilaian routes
router.use("/penilaian", penilaian);

// Defense routes
router.get("/defense/export-csv", requireAdmin, exportDefenseToCSV);
router.post("/defense/:id/assign-examiners", requireAdmin, assignExaminers);
router.post(
  "/defense/import-schedule",
  requireAdmin,
  csvUpload.single("schedule_file"),
  importScheduleCSV
);

// jadwal sidang route
router.get("/jadwal-sidang", getSchedule);

export default router;

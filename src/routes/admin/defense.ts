import { Router } from "express";
import multer from "multer";
import {
  exportDefenseToCSV,
  assignExaminers,
  importScheduleCSV,
} from "@/controllers/admin/defense/exportDefenseCsv";

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

// Defense routes
router.get("/export-csv", exportDefenseToCSV);
router.post("/:id/assign-examiners", assignExaminers);
router.post(
  "/import-schedule",

  csvUpload.single("schedule_file"),
  importScheduleCSV
);

export default router;

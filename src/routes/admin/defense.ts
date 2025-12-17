import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import {
  exportDefenseToCSV,
  assignExaminers,
  importScheduleCSV,
} from "@/controllers/admin/defense/exportDefenseCsv";
import { getNotScheduled } from "@/controllers/admin/defense/getNotScheduled";
import { getAllExaminers } from "@/controllers/admin/defense/getAllExaminers";
import { addSchedule } from "@/controllers/admin/defense/addSchedule";
import { editSchedule } from "@/controllers/admin/defense/editSchedule";
import { deleteSchedule } from "@/controllers/admin/defense/deleteSchedule";

const router = Router();

router.get("/belum-terjadwal", getNotScheduled);

router.get("/penguji", getAllExaminers);

router.post("/tambah", addSchedule);

router.put("/edit/:id", editSchedule);

router.delete("/hapus/:id", deleteSchedule);

// Ensure schedules directory exists
const schedulesDir = path.join(process.cwd(), "src/storages/schedules");
if (!fs.existsSync(schedulesDir)) {
  fs.mkdirSync(schedulesDir, { recursive: true });
}

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

import { Request, Response } from "express";
import { DefenseExportService } from "@/services/admin/defenseExportService";
import { DefenseScheduleImportService } from "@/services/admin/defenseScheduleService";
import { ApiResponse } from "@/types";
import fs from "fs";
import path from "path/win32";

/**
 * Export defense submissions to CSV
 * GET /admin/defense/export-csv?type=proposal|hasil
 */
export const exportDefenseToCSV = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { type } = req.query;

    // Validate type if provided
    if (type && !["proposal", "hasil"].includes(type as string)) {
      res.status(400).json({
        message: "Invalid defense type",
        errors: {
          path: "type",
          msg: "Defense type must be 'proposal' or 'hasil'",
        },
      });
      return;
    }

    const service = new DefenseExportService();
    const csvData = await service.exportToCSV(type as string | undefined);

    // Set headers for CSV download
    const filename = `defense_submissions_${type || "all"}_${Date.now()}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Add BOM for proper Excel UTF-8 handling
    res.write("\uFEFF");
    res.write(csvData);
    res.end();
  } catch (error) {
    console.error("Error exporting defense CSV:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat export CSV",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

/**
 * Assign examiners to a defense submission
 * POST /admin/defense/:id/assign-examiners
 */
export const assignExaminers = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { id } = req.params;
    const { examiner_1_id, examiner_2_id, defense_date } = req.body;

    if (!examiner_1_id && !examiner_2_id && !defense_date) {
      return res.status(400).json({
        message: "At least one field must be provided",
        errors: {
          path: "body",
          msg: "Provide examiner_1_id, examiner_2_id, or defense_date",
        },
      });
    }

    const service = new DefenseExportService();
    await service.assignExaminers(
      parseInt(id),
      examiner_1_id ? parseInt(examiner_1_id) : undefined,
      examiner_2_id ? parseInt(examiner_2_id) : undefined,
      defense_date ? new Date(defense_date) : undefined
    );

    return res.status(200).json({
      message: "Penguji berhasil ditugaskan",
      data: {
        defense_submission_id: parseInt(id),
        examiner_1_id,
        examiner_2_id,
        defense_date,
      },
    });
  } catch (error) {
    console.error("Error assigning examiners:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

/**
 * Import defense schedule from CSV
 * POST /admin/defense/import-schedule
 */
export const importScheduleCSV = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        message: "File CSV tidak ditemukan",
        errors: {
          path: "file",
          msg: "Upload file CSV dengan field name 'schedule_file'",
        },
      });
    }

    // Validate file extension
    if (!req.file.originalname.toLowerCase().endsWith(".csv")) {
      return res.status(400).json({
        message: "Format file tidak valid",
        errors: {
          path: "file",
          msg: "File harus berformat CSV",
        },
      });
    }

    const service = new DefenseScheduleImportService();
    const result = await service.importScheduleFromCSV(req.file.path);

    return res.status(200).json({
      message: `Import selesai: ${result.success} berhasil, ${result.failed} gagal`,
      data: {
        success_count: result.success,
        failed_count: result.failed,
        errors: result.errors,
      },
    });
  } catch (error) {
    console.error("Error importing schedule CSV:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat import CSV",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

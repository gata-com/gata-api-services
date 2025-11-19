import { Request, Response } from "express";
import { PenilaianService } from "@/services/admin/penilaianService";
import { BapService } from "@/services/admin/bapService";
import { ApiResponse } from "@/types";

const penilaianService = new PenilaianService();
const bapService = new BapService();

/**
 * View all penilaians (Admin)
 * GET /admin/penilaian/view-dosen
 */
export const viewAllPenilaians = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const penilaians = await penilaianService.getAllPenilaians();

    return res.status(200).json({
      message: "Penilaians retrieved successfully",
      data: penilaians,
    });
  } catch (error) {
    console.error("Error getting penilaians:", error);
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
 * Generate BAP PDF
 * POST /admin/penilaian/jadwal/:jadwalId/generate-bap
 */
export const generateBap = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const jadwalId = parseInt(req.params.jadwalId);

    if (isNaN(jadwalId)) {
      return res.status(400).json({
        message: "Invalid jadwal ID",
        errors: { path: "jadwalId", msg: "Jadwal ID must be a number" },
      });
    }

    const bap = await bapService.generateBap(jadwalId);

    return res.status(200).json({
      message: "BAP berhasil di-generate",
      data: {
        fileName: bap.fileName,
        fileUrl: bap.fileUrl,
        generatedAt: bap.createdAt,
      },
    });
  } catch (error) {
    console.error("Error generating BAP:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat generate BAP",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

/**
 * Download BAP
 * GET /admin/penilaian/jadwal/:jadwalId/bap
 */
export const downloadBap = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const jadwalId = parseInt(req.params.jadwalId);

    if (isNaN(jadwalId)) {
      res.status(400).json({
        message: "Invalid jadwal ID",
        errors: { path: "jadwalId", msg: "Jadwal ID must be a number" },
      });
      return;
    }

    const bap = await bapService.getBapByJadwalId(jadwalId);

    if (!bap) {
      res.status(404).json({
        message: "BAP tidak ditemukan",
        errors: { path: "jadwalId", msg: "BAP belum di-generate" },
      });
      return;
    }

    // TODO: Implement actual file download
    // For now, redirect to file URL
    res.redirect(bap.fileUrl);
  } catch (error) {
    console.error("Error downloading BAP:", error);
    res.status(500).json({
      message: "Terjadi kesalahan",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

/**
 * Preview BAP (HTML)
 * GET /admin/penilaian/jadwal/:jadwalId/bap/preview
 */
export const previewBap = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const jadwalId = parseInt(req.params.jadwalId);

    if (isNaN(jadwalId)) {
      res.status(400).json({
        message: "Invalid jadwal ID",
        errors: { path: "jadwalId", msg: "Jadwal ID must be a number" },
      });
      return;
    }

    const html = await bapService.generateBapHtml(jadwalId);

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    console.error("Error previewing BAP:", error);
    res.status(500).json({
      message: "Terjadi kesalahan",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

import { Request, Response } from "express";
import { BapPdfService } from "@/services/admin/bapPdfService";
import { ApiResponse, AuthRequest } from "@/types";

const bapPdfService = new BapPdfService();

/**
 * Generate BAP PDF for student
 * POST /admin/penilaian/jadwal/:jadwalId/student/:studentId/generate-bap
 */
export const generateBapPdf = async (
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const jadwalId = parseInt(req.params.jadwalId);
    const studentId = parseInt(req.params.studentId);
    const userId = req.user?.id;

    if (isNaN(jadwalId) || isNaN(studentId)) {
      return res.status(400).json({
        message: "Invalid jadwal ID or student ID",
        errors: {
          path: "params",
          msg: "Jadwal ID and Student ID must be numbers",
        },
      });
    }

    const bap = await bapPdfService.generateBapForStudent(
      userId,
      jadwalId,
      studentId
    );

    if (bap === "ttd missing") {
      return res.status(400).json({
        message: "Belum ada tanda tangan.",
        errors: {
          path: "ttd",
          msg: "Belum ada tanda tangan.",
        },
      });
    }

    return res.status(200).json({
      message: "BAP berhasil di-generate",
      data: bap,
    });
  } catch (error) {
    console.error("Error generating BAP PDF:", error);
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
 * Download BAP PDF by student
 * GET /admin/penilaian/student/:studentId/bap/download
 */
export const downloadBapByStudent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const studentId = parseInt(req.params.studentId);

    if (isNaN(studentId)) {
      res.status(400).json({
        message: "Invalid student ID",
        errors: { path: "studentId", msg: "Student ID must be a number" },
      });
      return;
    }

    const bap = await bapPdfService.getBapByStudentId(studentId);

    if (!bap) {
      res.status(404).json({
        message: "BAP tidak ditemukan",
        errors: {
          path: "studentId",
          msg: "BAP belum di-generate untuk mahasiswa ini",
        },
      });
      return;
    }

    const filePath = bapPdfService.getFilePath(bap.pdfName);

    if (!bapPdfService.fileExists(bap.pdfName)) {
      res.status(404).json({
        message: "File BAP tidak ditemukan",
        errors: { path: "file", msg: "File PDF tidak ada di server" },
      });
      return;
    }

    res.download(filePath, bap.pdfName);
  } catch (error) {
    console.error("Error downloading BAP:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat download BAP",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

/**
 * Download BAP PDF by filename
 * GET /admin/penilaian/bap/download/:pdfName
 */
export const downloadBapByName = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const pdfName = req.params.pdfName;

    if (!pdfName) {
      res.status(400).json({
        message: "Invalid PDF name",
        errors: { path: "pdfName", msg: "PDF name is required" },
      });
      return;
    }

    const bap = await bapPdfService.getBapByPdfName(pdfName);

    if (!bap) {
      res.status(404).json({
        message: "BAP tidak ditemukan",
        errors: { path: "pdfName", msg: "BAP tidak ditemukan di database" },
      });
      return;
    }

    const filePath = bapPdfService.getFilePath(pdfName);

    if (!bapPdfService.fileExists(pdfName)) {
      res.status(404).json({
        message: "File BAP tidak ditemukan",
        errors: { path: "file", msg: "File PDF tidak ada di server" },
      });
      return;
    }

    res.download(filePath, pdfName);
  } catch (error) {
    console.error("Error downloading BAP:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat download BAP",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

/**
 * Get BAP info by student ID
 * GET /admin/penilaian/student/:studentId/bap
 */
export const getBapInfo = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const studentId = parseInt(req.params.studentId);

    if (isNaN(studentId)) {
      return res.status(400).json({
        message: "Invalid student ID",
        errors: { path: "studentId", msg: "Student ID must be a number" },
      });
    }

    const bap = await bapPdfService.getBapByStudentId(studentId);

    if (!bap) {
      return res.status(404).json({
        message: "BAP tidak ditemukan",
        errors: {
          path: "studentId",
          msg: "BAP belum di-generate untuk mahasiswa ini",
        },
      });
    }

    return res.status(200).json({
      message: "BAP info retrieved successfully",
      data: {
        id: bap.id,
        pdfName: bap.pdfName,
        pdfUrl: bap.pdfUrl,
        nilaiAkhir: bap.nilaiAkhir,
        nilaiHuruf: bap.nilaiHuruf,
        generatedAt: bap.createdAt,
        student: {
          id: bap.student.id,
          nim: bap.student.nim,
          name: bap.student.user?.name,
        },
      },
    });
  } catch (error) {
    console.error("Error getting BAP info:", error);
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
 * Get all BAP
 * GET /admin/penilaian/bap/all
 */
export const getAllBap = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const baps = await bapPdfService.getAllBap();

    return res.status(200).json({
      message: "All BAP retrieved successfully",
      data: baps.map((bap) => ({
        id: bap.id,
        pdfName: bap.pdfName,
        pdfUrl: bap.pdfUrl,
        nilaiAkhir: bap.nilaiAkhir,
        nilaiHuruf: bap.nilaiHuruf,
        generatedAt: bap.createdAt,
        student: {
          id: bap.student.id,
          nim: bap.student.nim,
          name: bap.student.user?.name,
        },
      })),
    });
  } catch (error) {
    console.error("Error getting all BAP:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

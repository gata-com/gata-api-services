import { Request, Response } from "express";
import { ApiResponse, AuthRequest } from "@/types";
import { HasilSidangService } from "@/services/student/hasilSidangService";
import { StudentRepository } from "@/repositories/StudentRepository";
import * as fs from "fs";
import * as path from "path";

/**
 * GET /mahasiswa/hasil-sidang/:userId/download-bap
 * Mengunduh file BAP (Berita Acara Pemeriksaan) yang sudah ditandatangani
 * Parameter: userId (dari auth user)
 * Flow: userId → cari student by userId → ambil BAP file by studentId → stream file
 */
export const downloadBAP = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;

    // Validasi parameter
    if (!userId || isNaN(Number(userId))) {
      res.status(400).json({
        success: false,
        message: "Invalid user ID",
        errors: {
          path: "userId",
          msg: "User ID harus berupa angka yang valid",
        },
      });
      return;
    }

    // Cari student by userId
    const studentRepo = new StudentRepository();
    const student = await studentRepo.findByUserId(Number(userId));

    if (!student) {
      res.status(404).json({
        success: false,
        message: "Student tidak ditemukan",
        errors: {
          path: "userId",
          msg: "Student terkait dengan user ID ini tidak ditemukan",
        },
      });
      return;
    }

    // Ambil BAP file menggunakan studentId
    const hasilSidangService = new HasilSidangService();
    const result = await hasilSidangService.getBAPFile(student.id);

    if (!result.data || !result.data.bapUrl) {
      res.status(404).json({
        success: false,
        message: "BAP tidak ditemukan atau belum tersedia",
        errors: {
          path: "BAP",
          msg: "BAP file untuk mahasiswa ini belum ditandatangani atau tidak tersedia",
        },
      });
      return;
    }

    const bapUrl = result.data.bapUrl;
    const fileName = result.data.fileName || `BAP_${student.id}.pdf`;

    // Check if file exists
    if (!fs.existsSync(bapUrl)) {
      res.status(404).json({
        success: false,
        message: "File BAP tidak ditemukan di server",
        errors: {
          path: "BAP",
          msg: "File PDF tidak dapat diakses di server",
        },
      });
      return;
    }

    // Set headers untuk download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    // Stream file ke response
    const fileStream = fs.createReadStream(bapUrl);
    fileStream.pipe(res);

    fileStream.on("error", (error) => {
      console.error("Error streaming file:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat mengunduh file",
        errors: {
          path: "server",
          msg: error.message,
        },
      });
    });
  } catch (error) {
    console.error("Error in downloadBAP:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

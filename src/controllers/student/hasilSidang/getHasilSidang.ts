import { Request, Response } from "express";
import { ApiResponse, AuthRequest } from "@/types";
import { HasilSidangService } from "@/services/student/hasilSidangService";
import { StudentRepository } from "@/repositories/StudentRepository";

/**
 * GET /mahasiswa/hasil-sidang/:userId
 * Mengambil data hasil sidang (BAP results) untuk mahasiswa tertentu
 * Parameter: userId (dari auth user)
 * Flow: userId → cari student by userId → ambil hasil sidang by studentId
 */
export const getHasilSidang = async (
  req: AuthRequest,
  res: Response<ApiResponse>
) => {
  try {
    const { userId } = req.params;

    // Validasi parameter
    if (!userId || isNaN(Number(userId))) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
        errors: {
          path: "userId",
          msg: "User ID harus berupa angka yang valid",
        },
      });
    }

    // Cari student by userId
    const studentRepo = new StudentRepository();
    const student = await studentRepo.findByUserId(Number(userId));

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student tidak ditemukan",
        errors: {
          path: "userId",
          msg: "Student terkait dengan user ID ini tidak ditemukan",
        },
      });
    }

    // Ambil hasil sidang menggunakan studentId
    const hasilSidangService = new HasilSidangService();
    const result = await hasilSidangService.getHasilSidangByStudentId(
      student.id
    );

    if (!result.data) {
      return res.status(404).json({
        success: false,
        message: "Hasil sidang tidak ditemukan",
        errors: {
          path: "studentId",
          msg: "Student tidak ditemukan atau belum ada data hasil sidang",
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Hasil sidang berhasil diambil",
      data: result.data,
    });
  } catch (error) {
    console.error("Error in getHasilSidang:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

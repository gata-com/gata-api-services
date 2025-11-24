import { Request, Response } from "express";
import { StudentProfileService } from "@/services/student/studentProfileService";
import { ApiResponse } from "@/types";

const studentProfileService = new StudentProfileService();

/**
 * Get student profile
 * GET /student/profile
 */
export const getProfile = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Tidak terautentikasi",
        errors: {
          path: "auth",
          msg: "User ID not found in token",
        },
      });
    }

    const profile = await studentProfileService.getStudentProfile(userId);

    return res.status(200).json({
      message: "Profil mahasiswa berhasil diambil",
      data: profile,
    });
  } catch (error) {
    console.error("Error getting student profile:", error);

    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        message: "User tidak ditemukan",
        errors: { path: "userId", msg: "User not found" },
      });
    }

    if (error instanceof Error && error.message === "USER_IS_NOT_STUDENT") {
      return res.status(403).json({
        message: "User bukan mahasiswa",
        errors: { path: "role", msg: "User is not a student" },
      });
    }

    if (error instanceof Error && error.message === "STUDENT_DATA_NOT_FOUND") {
      return res.status(404).json({
        message: "Data mahasiswa tidak ditemukan",
        errors: { path: "student", msg: "Student data not found" },
      });
    }

    return res.status(500).json({
      message: "Terjadi kesalahan saat mengambil profile",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

/**
 * Update student profile
 * PUT /student/profile
 */
export const updateProfile = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const userId = (req as any).user?.id;
    const { name, nim, email, whatsapp_number, password } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Tidak terautentikasi",
        errors: {
          path: "auth",
          msg: "User ID not found in token",
        },
      });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (nim !== undefined) updateData.nim = nim;
    if (email !== undefined) updateData.email = email;
    if (whatsapp_number !== undefined)
      updateData.whatsapp_number = whatsapp_number;
    if (password !== undefined) updateData.password = password;

    // Check if any data is provided
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: "Tidak ada data yang akan diupdate",
        errors: { path: "body", msg: "No data provided" },
      });
    }

    const updatedProfile = await studentProfileService.updateStudentProfile(
      userId,
      updateData
    );

    return res.status(200).json({
      message: "Profil mahasiswa berhasil diperbarui",
      data: updatedProfile,
    });
  } catch (error) {
    console.error("Error updating student profile:", error);

    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        message: "User tidak ditemukan",
        errors: { path: "userId", msg: "User not found" },
      });
    }

    if (error instanceof Error && error.message === "USER_IS_NOT_STUDENT") {
      return res.status(403).json({
        message: "User bukan mahasiswa",
        errors: { path: "role", msg: "User is not a student" },
      });
    }

    if (error instanceof Error && error.message === "STUDENT_DATA_NOT_FOUND") {
      return res.status(404).json({
        message: "Data mahasiswa tidak ditemukan",
        errors: { path: "student", msg: "Student data not found" },
      });
    }

    if (error instanceof Error && error.message === "NAME_TOO_SHORT") {
      return res.status(400).json({
        message: "Validasi gagal",
        errors: { path: "name", msg: "Nama harus minimal 3 karakter" },
      });
    }

    if (error instanceof Error && error.message === "NAME_TOO_LONG") {
      return res.status(400).json({
        message: "Validasi gagal",
        errors: { path: "name", msg: "Nama maksimal 255 karakter" },
      });
    }

    if (error instanceof Error && error.message === "NIM_INVALID_LENGTH") {
      return res.status(400).json({
        message: "Validasi gagal",
        errors: { path: "nim", msg: "NIM harus 8-20 karakter" },
      });
    }

    if (error instanceof Error && error.message === "EMAIL_INVALID_FORMAT") {
      return res.status(400).json({
        message: "Validasi gagal",
        errors: { path: "email", msg: "Format email tidak valid" },
      });
    }

    if (
      error instanceof Error &&
      error.message === "WHATSAPP_NUMBER_INVALID_LENGTH"
    ) {
      return res.status(400).json({
        message: "Validasi gagal",
        errors: {
          path: "whatsapp_number",
          msg: "Nomor WhatsApp minimal 10 digit",
        },
      });
    }

    if (error instanceof Error && error.message === "EMAIL_ALREADY_EXISTS") {
      return res.status(409).json({
        message: "Email sudah terdaftar",
        errors: { path: "email", msg: "Email already exists" },
      });
    }

    if (error instanceof Error && error.message === "NIM_ALREADY_EXISTS") {
      return res.status(409).json({
        message: "NIM sudah terdaftar",
        errors: { path: "nim", msg: "NIM already exists" },
      });
    }

    return res.status(500).json({
      message: "Terjadi kesalahan saat mengupdate profile",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

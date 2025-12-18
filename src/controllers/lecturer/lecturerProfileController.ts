import { Request, Response } from "express";
import { LecturerProfileService } from "@/services/lecturer/lecturerProfileService";
import { ApiResponse } from "@/types";

const lecturerProfileService = new LecturerProfileService();

/**
 * Get lecturer profile
 * GET /lecturer/profile
 */
export const getLecturerProfile = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const userId = (req as any).user?.id;

    const profile = await lecturerProfileService.getLecturerProfile(userId);

    return res.status(200).json({
      message: "Data profil berhasil diambil",
      data: profile,
    });
  } catch (error) {
    console.error("Error getting admin profile:", error);

    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        message: "Profil admin tidak ditemukan",
        errors: { path: "userId", msg: "User not found" },
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
 * Update lecturer profile
 * PUT /lecturer/profile
 */
export const updateLecturerProfile = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const userId = (req as any).user?.id;
    const {
      name,
      email,
      nip,
      initials,
      whatsapp_number,
      password,
      expertise_group_1,
      expertise_group_2,
      expertise_group_3,
      expertise_group_4,
      signature_data,
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Tidak terautentikasi",
        errors: {
          path: "auth",
          msg: "User ID not found in token",
        },
      });
    }

    // Validate required fields
    if (!name || !email || !nip || !initials) {
      return res.status(400).json({
        message: "Validasi gagal",
        errors: {
          path: "body",
          msg: "name, email, nip, and initials are required",
        },
      });
    }

    // Validate expertise groups (must provide all 4 fields)
    if (
      expertise_group_1 === undefined ||
      expertise_group_2 === undefined ||
      expertise_group_3 === undefined ||
      expertise_group_4 === undefined
    ) {
      return res.status(400).json({
        message: "Validasi gagal",
        errors: {
          path: "body",
          msg: "All 4 expertise group fields are required (use null for empty slots)",
        },
      });
    }

    const updateData = {
      name,
      email,
      nip,
      initials,
      whatsapp_number,
      password,
      expertise_group_1,
      expertise_group_2,
      expertise_group_3,
      expertise_group_4,
      signature_data,
    };

    // Validate signature_data format if provided
    if (signature_data && signature_data.trim() !== "") {
      const isUrl = signature_data.startsWith("/signatures/");
      const isBase64 = signature_data.startsWith("data:image/");

      if (!isUrl && !isBase64) {
        return res.status(400).json({
          message: "Validasi gagal",
          errors: {
            path: "signature_data",
            msg: "Invalid signature format. Expected URL (/signatures/...) or base64 (data:image/png;base64,... or data:image/jpg;base64,...)",
          },
        });
      }

      // If base64, validate format more strictly
      if (isBase64) {
        const dataUrlRegex = /^data:image\/(png|jpg|jpeg);base64,/;
        if (!dataUrlRegex.test(signature_data)) {
          return res.status(400).json({
            message: "Validasi gagal",
            errors: {
              path: "signature_data",
              msg: "Invalid base64 format. Expected: data:image/png;base64,... or data:image/jpg;base64,...",
            },
          });
        }
      }
    }

    const updatedProfile = await lecturerProfileService.updateLecturerProfile(
      userId,
      updateData
    );

    return res.status(200).json({
      message: "Profil berhasil diperbarui",
      data: updatedProfile,
    });
  } catch (error) {
    console.error("Error updating admin profile:", error);

    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        message: "User tidak ditemukan",
        errors: { path: "userId", msg: "User not found" },
      });
    }

    if (error instanceof Error && error.message === "LECTURER_NOT_FOUND") {
      return res.status(404).json({
        message: "Data dosen tidak ditemukan",
        errors: { path: "lecturer", msg: "Lecturer not found" },
      });
    }

    if (error instanceof Error && error.message === "USER_IS_NOT_LECTURER") {
      return res.status(403).json({
        message: "User bukan dosen",
        errors: { path: "role", msg: "User is not a lecturer" },
      });
    }

    if (error instanceof Error && error.message === "EMAIL_ALREADY_EXISTS") {
      return res.status(409).json({
        message: "Email atau NIP sudah terdaftar",
        errors: { path: "email", msg: "Email already exists" },
      });
    }

    if (error instanceof Error && error.message === "NIP_ALREADY_EXISTS") {
      return res.status(409).json({
        message: "Email atau NIP sudah terdaftar",
        errors: { path: "nip", msg: "NIP already exists" },
      });
    }

    if (
      error instanceof Error &&
      error.message.includes("Gagal menyimpan file signature")
    ) {
      return res.status(400).json({
        message: "Upload signature gagal",
        errors: { path: "signature_data", msg: error.message },
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

/**
 * Get all expertises groups
 * GET /admin/profile/expertises-groups
 */
export const getAllExpertisesGroups = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const expertisesGroups =
      await lecturerProfileService.getAllExpertisesGroups();

    return res.status(200).json({
      message: "Expertises groups retrieved successfully",
      data: expertisesGroups,
    });
  } catch (error) {
    console.error("Error getting expertises groups:", error);

    return res.status(500).json({
      message: "Terjadi kesalahan saat mengambil expertises groups",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

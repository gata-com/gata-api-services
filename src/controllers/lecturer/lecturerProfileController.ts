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
      message: "Lecturer profile retrieved successfully",
      data: profile,
    });
  } catch (error) {
    console.error("Error getting lecturer profile:", error);

    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        message: "User tidak ditemukan",
        errors: { path: "userId", msg: "User not found" },
      });
    }

    if (error instanceof Error && error.message === "USER_IS_NOT_LECTURER") {
      return res.status(403).json({
        message: "User bukan dosen",
        errors: { path: "role", msg: "User is not a lecturer" },
      });
    }

    if (error instanceof Error && error.message === "LECTURER_DATA_NOT_FOUND") {
      return res.status(404).json({
        message: "Data dosen tidak ditemukan",
        errors: { path: "lecturer", msg: "Lecturer data not found" },
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
      expertise_group_1,
      expertise_group_2,
      expertise_group_3,
      expertise_group_4,
      password,
    } = req.body;


    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (nip !== undefined) updateData.nip = nip;
    if (initials !== undefined) updateData.initials = initials;
    if (whatsapp_number !== undefined)
      updateData.whatsapp_number = whatsapp_number;
    if (expertise_group_1 !== undefined)
      updateData.expertise_group_1 = expertise_group_1;
    if (expertise_group_2 !== undefined)
      updateData.expertise_group_2 = expertise_group_2;
    if (expertise_group_3 !== undefined)
      updateData.expertise_group_3 = expertise_group_3;
    if (expertise_group_4 !== undefined)
      updateData.expertise_group_4 = expertise_group_4;
    if (password !== undefined) updateData.password = password;

    // Check if any data is provided
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: "Tidak ada data yang akan diupdate",
        errors: { path: "body", msg: "No data provided" },
      });
    }

    const updatedProfile = await lecturerProfileService.updateLecturerProfile(
      userId,
      updateData
    );

    return res.status(200).json({
      message: "Lecturer profile berhasil diupdate",
      data: updatedProfile,
    });
  } catch (error) {
    console.error("Error updating lecturer profile:", error);

    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        message: "User tidak ditemukan",
        errors: { path: "userId", msg: "User not found" },
      });
    }

    if (error instanceof Error && error.message === "USER_IS_NOT_LECTURER") {
      return res.status(403).json({
        message: "User bukan dosen",
        errors: { path: "role", msg: "User is not a lecturer" },
      });
    }

    if (error instanceof Error && error.message === "LECTURER_DATA_NOT_FOUND") {
      return res.status(404).json({
        message: "Data dosen tidak ditemukan",
        errors: { path: "lecturer", msg: "Lecturer data not found" },
      });
    }

    if (error instanceof Error && error.message === "EMAIL_ALREADY_EXISTS") {
      return res.status(400).json({
        message: "Email sudah terdaftar",
        errors: { path: "email", msg: "Email already exists" },
      });
    }

    if (error instanceof Error && error.message === "NIP_ALREADY_EXISTS") {
      return res.status(400).json({
        message: "NIP sudah terdaftar",
        errors: { path: "nip", msg: "NIP already exists" },
      });
    }

    if (
      error instanceof Error &&
      error.message.startsWith("EXPERTISE_GROUP_NOT_FOUND")
    ) {
      return res.status(400).json({
        message: "Kelompok keahlian tidak ditemukan",
        errors: { path: "expertise_group", msg: "Expertise group not found" },
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
 * GET /lecturer/profile/expertises-groups
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

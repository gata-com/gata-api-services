import { Request, Response } from "express";
import { AdminProfileService } from "@/services/admin/adminProfileService";
import { ApiResponse } from "@/types";

const adminProfileService = new AdminProfileService();

/**
 * Get admin profile
 * GET /admin/profile
 */
export const getAdminProfile = async (
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

    const profile = await adminProfileService.getAdminProfile(userId);

    return res.status(200).json({
      message: "Admin profile retrieved successfully",
      data: profile,
    });
  } catch (error) {
    console.error("Error getting admin profile:", error);

    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        message: "User tidak ditemukan",
        errors: { path: "userId", msg: "User not found" },
      });
    }

    if (error instanceof Error && error.message === "USER_IS_NOT_ADMIN") {
      return res.status(403).json({
        message: "User bukan admin",
        errors: { path: "role", msg: "User is not an admin" },
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
 * Update admin profile
 * PUT /admin/profile
 */
export const updateAdminProfile = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const userId = (req as any).user?.id;
    const { name, email, whatsapp_number, password } = req.body;

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

    const updatedProfile = await adminProfileService.updateAdminProfile(
      userId,
      updateData
    );

    return res.status(200).json({
      message: "Admin profile berhasil diupdate",
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

    if (error instanceof Error && error.message === "USER_IS_NOT_ADMIN") {
      return res.status(403).json({
        message: "User bukan admin",
        errors: { path: "role", msg: "User is not an admin" },
      });
    }

    if (error instanceof Error && error.message === "EMAIL_ALREADY_EXISTS") {
      return res.status(400).json({
        message: "Email sudah terdaftar",
        errors: { path: "email", msg: "Email already exists" },
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
    const expertisesGroups = await adminProfileService.getAllExpertisesGroups();

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

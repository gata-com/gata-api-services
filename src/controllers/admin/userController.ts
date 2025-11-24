import { Request, Response } from "express";
import {
  UserService,
  CreateUserRequest,
  UpdateUserRequest,
} from "@/services/admin/userService";
import { ApiResponse } from "@/types";

const userService = new UserService();

/**
 * Get all users with pagination and filtering
 * GET /admin/users
 */
export const getAllUsers = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { page, limit, role, is_active, search } = req.query;

    const result = await userService.getAllUsers({
      page,
      limit,
      role,
      is_active,
      search,
    });

    return res.status(200).json({
      message: "Users retrieved successfully",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error getting users:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat mengambil data user",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

/**
 * Get user by ID
 * GET /admin/users/:id
 */
export const getUserById = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(parseInt(id));

    return res.status(200).json({
      message: "User retrieved successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error getting user:", error);

    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        message: "User tidak ditemukan",
        errors: { path: "id", msg: "User not found" },
      });
    }

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
 * Create new user
 * POST /admin/users
 */
export const createUser = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { role, email, name, nip, nim, initials, whatsapp_number, password } =
      req.body;

    const createUserData: CreateUserRequest = {
      role,
      email,
      name,
      nip,
      nim,
      initials,
      password,
      whatsapp_number,
    };

    const newUser = await userService.createUser(createUserData);

    return res.status(201).json({
      message: "User berhasil dibuat",
      data: newUser,
    });
  } catch (error) {
    console.error("Error creating user:", error);

    if (error instanceof Error && error.message === "EMAIL_ALREADY_EXISTS") {
      return res.status(400).json({
        message: "Email sudah terdaftar",
        errors: { path: "email", msg: "Email already exists" },
      });
    }

    if (
      error instanceof Error &&
      error.message === "NIP_REQUIRED_FOR_LECTURER"
    ) {
      return res.status(400).json({
        message: "NIP harus diisi untuk dosen",
        errors: { path: "nip", msg: "NIP is required for lecturer" },
      });
    }

    return res.status(500).json({
      message: "Terjadi kesalahan saat membuat user",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

/**
 * Update user
 * PUT /admin/users/:id
 */
export const updateUser = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { id } = req.params;
    const { role, name, email, password, whatsapp_number, is_active } =
      req.body;

    const updateUserData: UpdateUserRequest = {};

    if (role !== undefined) updateUserData.role = role;
    if (name !== undefined) updateUserData.name = name;
    if (email !== undefined) updateUserData.email = email;
    if (password !== undefined) updateUserData.password = password;
    if (whatsapp_number !== undefined)
      updateUserData.whatsapp_number = whatsapp_number;
    if (is_active !== undefined) updateUserData.is_active = is_active;

    // Check if any data is provided
    if (Object.keys(updateUserData).length === 0) {
      return res.status(400).json({
        message: "Tidak ada data yang akan diupdate",
        errors: { path: "body", msg: "No data provided" },
      });
    }

    const updatedUser = await userService.updateUser(
      parseInt(id),
      updateUserData
    );

    return res.status(200).json({
      message: "User berhasil diupdate",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);

    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        message: "User tidak ditemukan",
        errors: { path: "id", msg: "User not found" },
      });
    }

    if (error instanceof Error && error.message === "EMAIL_ALREADY_EXISTS") {
      return res.status(400).json({
        message: "Email sudah terdaftar",
        errors: { path: "email", msg: "Email already exists" },
      });
    }

    return res.status(500).json({
      message: "Terjadi kesalahan saat mengupdate user",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

/**
 * Delete user (soft delete)
 * DELETE /admin/users/:id
 */
export const deleteUser = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { id } = req.params;

    await userService.deleteUser(parseInt(id));

    return res.status(200).json({
      message: "User berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting user:", error);

    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        message: "User tidak ditemukan",
        errors: { path: "id", msg: "User not found" },
      });
    }

    return res.status(500).json({
      message: "Terjadi kesalahan saat menghapus user",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

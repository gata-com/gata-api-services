// controllers/auth/login.ts
import { Request, Response } from "express";
import dotenv from "dotenv";
import { AuthService } from "../../services/auth/authServices";
import { ApiResponse } from "@/types";
import { LoginRequest } from "@/types/auth";

dotenv.config();

export const login = async (
  req: Request<LoginRequest>,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const authService = new AuthService();
    const result = await authService.login(req.body);

    if ("error" in result && result.error) {
      return res.status(400).json({
        message: "Error Validation",
        errors: result.error,
      });
    }

    // cookie for middleware authentication
    // For production, consider setting 'secure: true' and 'sameSite' appropriately
    res.cookie("token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // result is now guaranteed to have token and user
    return res.status(200).json({
      message: "Login berhasil",
      data: {
        token: result.token,
        user: {
          name: result.user.name,
          role: result.user.role,
          email: result.user.email,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Terjadi kesalahan",
      errors: {
        field: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

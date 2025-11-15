// controllers/auth/forgotPassword.ts
import { Request, Response } from "express";
import { ApiResponse } from "@/types";
import { AuthService } from "@/services/auth/AuthServices";

export const forgotPassword = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const authService = new AuthService();
    const result = await authService.forgotPassword(req.body);

    if ("error" in result && result.error) {
      return res.status(400).json({
        message: "Error Validation",
        errors: result.error,
      });
    }

    return res.status(200).json({
      message: "Cek email untuk reset password.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Terjadi kesalahan",
      errors: {
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

import { Request, Response } from "express";
import { ApiResponse } from "@/types";
import { AuthService } from "@/services/auth/AuthServices";

export const verifyResetToken = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { token } = req.params;

    const authService = new AuthService();
    const result = await authService.verifyResetToken({ token });

    if ("error" in result && result.error) {
      return res.status(400).json({
        message: "Error Validation",
        errors: result.error,
      });
    }

    return res.status(200).json({
      message: "Token valid",
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

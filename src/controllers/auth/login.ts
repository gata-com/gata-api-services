// controllers/auth/login.ts
import { Request, Response } from "express";
import dotenv from "dotenv";
import { AuthService } from "@/services/auth/AuthServices";
import { ApiResponse } from "@/types";

dotenv.config();

export const login = async (
  req: Request,
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
    const isProduction = process.env.NODE_ENV === "production";
    const useHttps = process.env.USE_HTTPS === "true";

    const cookieOptions: any = {
      httpOnly: true,
      secure: isProduction && useHttps, // Must be true for sameSite: "none"
      sameSite: isProduction && useHttps ? "none" : "lax", // "none" requires secure: true
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    // Add domain if set (use parent domain like .gata.web.id for cross-subdomain)
    // Leave empty to default to current domain only
    if (process.env.COOKIE_DOMAIN) {
      let domain = process.env.COOKIE_DOMAIN.replace(
        /^https?:\/\//,
        ""
      ).replace(/\/$/, "");
      cookieOptions.domain = domain;
    }

    res.cookie("token", result.token, cookieOptions);

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
        path: "server",
        msg: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRepository } from "@/repositories/UserRepository";
import { AuthRequest, ApiResponse } from "@/types";
import { JwtPayload } from "@/types/auth";

const userRepository = new UserRepository();

export const auth = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.header("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({
        message: "Access denied. No token provided",
        errors: {
          path: "NO_TOKEN",
          msg: "Authorization header missing or token not found",
        },
      });
      return;
    }

    // Debug logging
    if (process.env.NODE_ENV === "development") {
      console.log("[AUTH] Verifying token...");
      console.log("[AUTH] JWT_SECRET configured:", !!process.env.JWT_SECRET);
    }

    if (!process.env.JWT_SECRET) {
      console.error("[AUTH] CRITICAL: JWT_SECRET not configured!");
      res.status(500).json({
        message: "Server configuration error",
        errors: {
          path: "SERVER_CONFIG_ERROR",
          msg: "JWT_SECRET not configured",
        },
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

    const user = await userRepository.findById(parseInt(decoded.id));

    if (!user || !user.is_active) {
      res.status(401).json({
        message: "Token is invalid or user is deactivated",
        errors: {
          path: "INVALID_USER",
          msg: "User not found or deactivated",
        },
      });
      return;
    }

    // ✅ QUICK FIX: Use type assertion
    (req.user as any) = {
      id: decoded.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    next();
  } catch (error: any) {
    console.error("[AUTH] Verification error:", {
      path: error.code,
      msg: error.message,
      name: error.name,
    });

    res.status(401).json({
      message: "Token is invalid",
      errors: {
        path: error.code || "TOKEN_VERIFICATION_FAILED",
        msg: error.message,
      },
    });
  }
};

// Authentication for google
export const authenticateToken = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Access token required" });
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err: any, user: any) => {
    if (err) {
      res.status(403).json({ message: "Invalid token" });
    }
    req.user = user;
    next();
  });
};

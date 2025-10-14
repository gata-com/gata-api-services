import { Response, NextFunction } from "express";
import { AuthRequest, ApiResponse } from "../types";

export const requireRole = (roles: string[]) => {
  return (req: any, res: Response<ApiResponse>, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required roles: ${roles.join(", ")}`,
      });
    }

    next();
    return;
  };
};

// Middleware khusus untuk setiap role
export const requireStudent = requireRole(["student"]);
export const requireLecturer = requireRole(["lecturer"]);
export const requireAdmin = requireRole(["admin"]);
export const requireLecturerOrAdmin = requireRole(["lecturer", "admin"]);

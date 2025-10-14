import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRepository } from "../repositories/UserRepository";
import { AuthRequest, ApiResponse } from "../types";
import { JwtPayload } from "../types/auth";

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
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    const user = await userRepository.findById(parseInt(decoded.id));

    if (!user || !user.is_active) {
      res.status(401).json({
        message: "Token is invalid or user is deactivated",
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
    res.status(401).json({
      errors: error.message,
      message: "Token is invalid",
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

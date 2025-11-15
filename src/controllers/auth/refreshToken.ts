// controllers/auth/refreshToken.ts
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import db from "../../config/database";
import dotenv from "dotenv";
import { AuthRequest } from "../../types";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "secretkey";

// Extend Request interface untuk include user

export const refreshToken = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    // Validasi user dari middleware auth
    if (!req.user) {
      return res.status(401).json({
        message: "User tidak terautentikasi",
      });
    }

    const userId = req.user.id;

    // Ambil data user terbaru dari database untuk pastikan masih aktif
    const [rows] = await db.query(
      "SELECT id, name, email, created_at FROM users WHERE id = ?",
      [userId]
    );
    const users = rows as any[];

    if (users.length === 0) {
      return res.status(404).json({
        message: "User tidak ditemukan",
      });
    }

    const user = users[0];

    // Generate token baru dengan data terbaru
    const newToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Optional: Update last activity timestamp
    try {
      await db.query("UPDATE users SET last_activity = NOW() WHERE id = ?", [
        user.id,
      ]);
    } catch (updateError) {
      // Non-critical error, just log it
      console.log("Failed to update last_activity:", updateError);
    }

    return res.status(200).json({
      message: "Token berhasil di-refresh",
      token: newToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      expiresIn: "1h",
    });
  } catch (error) {
    console.error("Error in refreshToken:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan",
      error,
    });
  }
};

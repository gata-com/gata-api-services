import { Request, Response } from "express";
import db from "../../config/database";
import { AuthRequest } from "../../types";

export const getProfile = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    // Check if user exists in request (from auth middleware)
    if (!req.user) {
      return res.status(401).json({ message: "User tidak terautentikasi" });
    }

    const userId = req.user.id;

    const [rows] = await db.query(
      "SELECT id, name, email, created_at FROM users WHERE id = ?",
      [userId]
    );
    const users = rows as any[];

    if (users.length === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    return res.status(200).json({
      message: "Profile berhasil diambil",
      user: users[0],
    });
  } catch (error) {
    console.error("Error in getProfile:", error);
    return res.status(500).json({ message: "Terjadi kesalahan", error });
  }
};

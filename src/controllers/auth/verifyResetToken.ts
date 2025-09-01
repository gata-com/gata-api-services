import { Request, Response } from "express";
import db from "../../config/database";

export const verifyResetToken = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { token } = req.params;

    // Validasi token parameter exists
    if (!token) {
      return res.status(400).json({ 
        message: "Token tidak ditemukan",
        valid: false 
      });
    }

    const [rows] = await db.query(
      "SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()",
      [token]
    );
    const users = rows as any[];

    if (users.length === 0) {
      return res.status(400).json({ 
        message: "Token tidak valid atau kadaluarsa",
        valid: false 
      });
    }

    return res.status(200).json({ 
      message: "Token valid", 
      valid: true 
    });
  } catch (error) {
    console.error("Error in verifyResetToken:", error);
    return res.status(500).json({ 
      message: "Terjadi kesalahan", 
      valid: false,
      error 
    });
  }
};
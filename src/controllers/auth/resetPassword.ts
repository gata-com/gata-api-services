// controllers/auth/resetPassword.ts
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import db from "../../config/database";

export const resetPassword = async (req: Request, res: Response): Promise<Response> => {
  try {
    
    const { token,password } = req.body;

    // Validasi input
    if (!token) {
      return res.status(400).json({ 
        message: "Token tidak ditemukan" 
      });
    }

    if (!password) {
      return res.status(400).json({ 
        message: "Password baru wajib diisi" 
      });
    }

    // Validasi password strength (optional)
    if (password.length < 6) {
      return res.status(400).json({ 
        message: "Password minimal 6 karakter" 
      });
    }

    // Cek token valid dan belum expired
    const [rows] = await db.query(
      "SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()",
      [token]
    );
    const users = rows as any[];

    if (users.length === 0) {
      return res.status(400).json({ 
        message: "Token tidak valid atau kadaluarsa" 
      });
    }

    const user = users[0];

    // Hash password baru
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update password dan hapus reset token
    await db.query(
      "UPDATE users SET password = ?, reset_token = NULL, reset_token_expire = NULL WHERE id = ?",
      [hashedPassword, user.id]
    );

    return res.status(200).json({ 
      message: "Password berhasil direset",
      success: true 
    });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    return res.status(500).json({ 
      message: "Terjadi kesalahan", 
      success: false,
      error 
    });
  }
};
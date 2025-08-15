// controllers/auth/forgotPassword.ts
import { Request, Response } from "express";
import crypto from "crypto";
import db from "../../config/database";
import { sendResetPasswordEmail } from "../../services/emailService";

export const forgotPassword = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email } = req.body;

    // Validasi input
    if (!email) {
      return res.status(400).json({ 
        message: "Email wajib diisi" 
      });
    }

    // Validasi format email (basic)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: "Format email tidak valid" 
      });
    }

    // Cari user berdasarkan email dan ambil nama untuk template
    const [rows] = await db.query("SELECT id, nama, email FROM users WHERE email = ?", [email]);
    const users = rows as any[];

    if (users.length === 0) {
      // Security: Jangan kasih tau email tidak ada, return success aja
      // Untuk prevent email enumeration attack
      return res.status(200).json({ 
        message: "Jika email terdaftar, link reset password akan dikirim" 
      });
    }

    const user = users[0];

    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex");
    const expireTime = new Date(Date.now() + 3600000); // 1 jam dari sekarang

    // Simpan token ke database
    await db.query(
      "UPDATE users SET reset_token = ?, reset_token_expire = ? WHERE id = ?", 
      [token, expireTime, user.id]
    );

    // Kirim email menggunakan service
    try {
      await sendResetPasswordEmail(user.email, token, user.nama);
    } catch (emailError) {
      console.error("Failed to send reset email:", emailError);
      // Hapus token jika email gagal dikirim
      await db.query(
        "UPDATE users SET reset_token = NULL, reset_token_expire = NULL WHERE id = ?", 
        [user.id]
      );
      
      return res.status(500).json({ 
        message: "Gagal mengirim email reset password" 
      });
    }

    return res.status(200).json({ 
      message: "Email reset password telah dikirim",
      success: true
    });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    return res.status(500).json({ 
      message: "Terjadi kesalahan", 
      success: false,
      error 
    });
  }
};
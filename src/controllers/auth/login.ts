// controllers/auth/login.ts
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import  AppDataSource  from "../../config/database";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "secretkey";

export const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;

    // Validasi input
    if (!email || !password) {
      return res.status(400).json({ 
        message: "Email dan password wajib diisi" 
      });
    }

    // Cari user dengan raw query TypeORM
    const users = await AppDataSource.query(
      "SELECT * FROM users WHERE email = ?", 
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ 
        message: "Email tidak ditemukan" 
      });
    }

    const user = users[0];

    // Validasi password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({ 
        message: "Password salah" 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        nama: user.nama, // Sesuai dengan field database
        nim: user.nim,
        role: user.role
      }, 
      JWT_SECRET, 
      { expiresIn: "1h" }
    );

    // Update last login
    try {
      await AppDataSource.query(
        "UPDATE users SET last_login = NOW() WHERE id = ?", 
        [user.id]
      );
    } catch (updateError) {
      console.log("Failed to update last_login:", updateError);
    }

    return res.status(200).json({ 
      message: "Login berhasil", 
      token,
      user: {
        userId: user.id,
        nama: user.nama,
        email: user.email,
        nim: user.nim,
        role: user.role
      }
    });
    
  } catch (error: any) {
    console.error("Error in login:", error);
    return res.status(500).json({ 
      message: "Terjadi kesalahan", 
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};
// controllers/auth/login.ts
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import AppDataSource from "../../config/database";
import dotenv from "dotenv";
import { UserRepository } from "../../repositories/UserRepository";

import { ApiResponse } from "@/types";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "secretkey";

export const login = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<Response> => {
  try {
    const { email, password } = req.body;

    const userRepo = new UserRepository();

    // Validasi input
    // Cari user dengan raw query TypeORM
    const user = await userRepo.findByEmail(email);

    console.log("User found:", user);

    if (!user) {
      return res.status(400).json({
        message: "Error Validation",
        errors: { field: "email", msg: "Email tidak ditemukan" },
      });
    }

    // Validasi password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({
        message: "Error Validation",
        errors: { field: "password", msg: "Password salah" },
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        name: user.name, // Sesuai dengan field database
        email: user.email,
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
      data: {
        token: token,
        user: {
          role: user.role,
          email: user.email,
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Terjadi kesalahan",
      errors: { field: "server", msg: error.message },
    });
  }
};

// controllers/auth/resetPassword.ts
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import AppDataSource from "../../config/database";
import User from "../../entities/user";

export const resetPassword = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    console.log("🔄 Reset password request received");
    console.log("📤 Request body:", {
      hasToken: !!req.body.token,
      tokenLength: req.body.token?.length || 0,
      hasPassword: !!req.body.password,
      passwordLength: req.body.password?.length || 0,
    });

    const { token, password } = req.body;

    // Validasi input
    if (!token) {
      console.log("❌ Token missing");
      return res.status(400).json({
        message: "Token tidak ditemukan",
        success: false,
        error: "MISSING_TOKEN",
      });
    }

    if (!password) {
      console.log("❌ Password missing");
      return res.status(400).json({
        message: "Password baru wajib diisi",
        success: false,
        error: "MISSING_PASSWORD",
      });
    }

    // Validasi password strength
    if (password.length < 6) {
      console.log("❌ Password too short");
      return res.status(400).json({
        message: "Password minimal 6 karakter",
        success: false,
        error: "PASSWORD_TOO_SHORT",
      });
    }

    console.log("🔍 Searching for user with token...");

    // Clean the token
    const cleanToken = token?.trim();
    console.log("🧹 Cleaned token:", cleanToken);

    // Gunakan TypeORM Repository
    const userRepository = AppDataSource.getRepository(User);

    // Cari user dengan token yang valid dan belum expired
    const user = await userRepository
      .createQueryBuilder("user")
      .addSelect([
        "user.resetToken",
        "user.reset_token_expires",
        "user.password",
      ])
      .where("user.resetToken = :token", { token: cleanToken })
      .getOne();

    console.log("📊 Query result:", {
      userFound: !!user,
      userId: user?.id || null,
      tokenExpires: user?.reset_token_expires || null,
      currentTime: new Date(),
      isExpired: user?.reset_token_expires
        ? user.reset_token_expires < new Date()
        : null,
      // Debug raw user object
      userResetToken: user?.reset_token
        ? user.reset_token.substring(0, 20) + "..."
        : null,
      hasResetTokenExpires: !!user?.reset_token_expires,
    });

    if (!user) {
      console.log("❌ User with token not found");
      return res.status(400).json({
        message: "Token tidak valid atau kadaluarsa",
        success: false,
        error: "INVALID_TOKEN",
      });
    }

    // Check if token is expired
    if (!user.reset_token_expires || user.reset_token_expires < new Date()) {
      console.log("❌ Token expired");
      return res.status(400).json({
        message: "Token tidak valid atau kadaluarsa",
        success: false,
        error: "TOKEN_EXPIRED",
      });
    }

    console.log("✅ User found:", {
      userId: user.id,
      email: user.email?.substring(0, 3) + "***",
    });

    // Hash password baru
    console.log("🔐 Hashing new password...");
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password dan hapus reset token
    console.log("💾 Updating user password and clearing reset token...");
    user.password = hashedPassword;
    user.reset_token = undefined;
    user.reset_token_expires = undefined;

    await userRepository.save(user);

    console.log("✅ Password updated successfully for user:", user.id);

    return res.status(200).json({
      message: "Password berhasil direset",
      success: true,
      data: {
        userId: user.id,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.error("❌ Error in resetPassword:", error);

    // Handle TypeORM specific errors
    if (error.name === "QueryFailedError") {
      return res.status(500).json({
        message: "Terjadi kesalahan database",
        success: false,
        error: "DATABASE_ERROR",
      });
    }

    // Handle bcrypt errors
    if (error.message?.includes("bcrypt")) {
      return res.status(500).json({
        message: "Gagal mengenkripsi password",
        success: false,
        error: "ENCRYPTION_ERROR",
      });
    }

    // Generic error response
    return res.status(500).json({
      message: "Terjadi kesalahan pada server",
      success: false,
      error: {
        type: error.name || "UNKNOWN_ERROR",
        message: error.message || "Unknown server error",
        // Jangan kirim stack trace di production
        ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
      },
    });
  }
};

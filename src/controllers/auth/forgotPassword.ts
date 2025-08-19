// controllers/auth/forgotPassword.ts
import { Request, Response } from "express";
import crypto from "crypto";
import { AppDataSource } from "../../config/database";
import { User } from "../../entities/user";
import { sendResetPasswordEmail } from "../../utils/email"; // Pakai yang dari utils

export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<Response> => {
  console.log('=== FORGOT PASSWORD START ===');
  
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email wajib diisi",
        success: false
      });
    }

    console.log('Looking for user with email:', email);

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { email }
    });

    // Untuk security, selalu return success message
    if (!user) {
      console.log('User not found, but returning success message for security');
      return res.status(200).json({
        message: "Jika email terdaftar, link reset password akan dikirim",
        success: true
      });
    }

    console.log('User found, generating reset token...');

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date();
    resetTokenExpires.setHours(resetTokenExpires.getHours() + 1);

    // Update user dengan reset token
    user.resetToken = resetToken;
    user.resetTokenExpires = resetTokenExpires;
    
    await userRepository.save(user);
    console.log('Reset token saved to database');

    // Kirim email menggunakan utils/email.ts
    try {
      console.log('Sending reset password email...');
      // Function signature: sendResetPasswordEmail(email, token, nama)
      const emailSent = await sendResetPasswordEmail(email, resetToken, user.nama);
      
      if (emailSent) {
        console.log('Reset password email sent successfully');
        
        return res.status(200).json({
          message: "Link reset password telah dikirim ke email Anda",
          success: true,
          ...(process.env.NODE_ENV === 'development' && {
            developmentOnly: {
              resetToken,
              resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
              expiresAt: resetTokenExpires
            }
          })
        });
      } else {
        throw new Error('Email service returned false');
      }

    } catch (emailError: unknown) {
      console.error('Failed to send email:', emailError);
      
      // Rollback: hapus reset token jika email gagal
      user.resetToken = undefined;
      user.resetTokenExpires = undefined;
      await userRepository.save(user);
      
      // Type guard untuk mengakses message property
      const errorMessage = emailError instanceof Error ? emailError.message : 'Unknown error occurred';
      
      return res.status(500).json({
        message: "Gagal mengirim email. Silakan coba lagi",
        success: false,
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }

  } catch (error: unknown) {
    console.error('Forgot password error:', error);
    
    return res.status(500).json({
      message: "Terjadi kesalahan server",
      success: false
    });
  }
};
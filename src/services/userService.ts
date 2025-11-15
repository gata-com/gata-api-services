import bcrypt from "bcrypt";
import crypto from "crypto";
import { UserRepository } from "../repositories/UserRepository";
import { CreateUserData, UpdateUserData, UserQueryParams } from "../types/user";
import { PaginationQuery, PaginationResult } from "../types";
import User from "../entities/user";

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async getAllUsers(
    query: UserQueryParams & PaginationQuery
  ): Promise<PaginationResult<User>> {
    return await this.userRepository.findAllWithPagination(query);
  }

  async getUserById(id: number): Promise<User | null> {
    return await this.userRepository.findById(id);
  }

  // async createUser(userData: CreateUserData): Promise<User> {
  //   // Check if user already exists
  //   const existingUser = await this.userRepository.findByEmailOrNim(
  //     userData.email,
  //     userData.name
  //   );
  //   if (existingUser) {
  //     throw new Error("User with this email or NIM already exists");
  //   }

  //   // Hash password
  //   const saltRounds = 12;
  //   const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

  //   // Create user with hashed password
  //   const userToCreate = {
  //     ...userData,
  //     password: hashedPassword,
  //     email: userData.email.toLowerCase(),
  //   };

  //   return await this.userRepository.create(userToCreate);
  // }

  async updateUser(
    id: number,
    updateData: UpdateUserData
  ): Promise<User | null> {
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error("User not found");
    }

    // Check email uniqueness if email is being updated
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await this.userRepository.findByEmail(
        updateData.email
      );
      if (emailExists) {
        throw new Error("Email already exists");
      }
      updateData.email = updateData.email.toLowerCase();
    }

    // Hash password if provided
    if (updateData.password) {
      const saltRounds = 12;
      updateData.password = await bcrypt.hash(updateData.password, saltRounds);
    }

    return await this.userRepository.update(id, updateData);
  }

  async deleteUser(id: number): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error("User not found");
    }

    // Soft delete
    await this.userRepository.softDelete(id);
  }

  async changePassword(
    id: number,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await this.userRepository.findByIdWithPassword(id);
    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await this.userRepository.update(id, { password: hashedPassword });
  }

  async getUserStats(): Promise<{
    total: number;
    student: number;
    admin: number;
    lecturer: number;
  }> {
    const [total, student, admin, lecturer] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.countByRole("student"),
      this.userRepository.countByRole("admin"),
      this.userRepository.countByRole("lecturer"),
    ]);

    return { total, student, admin, lecturer };
  }

  // ===== PASSWORD RESET METHODS =====

  async forgotPassword(email: string): Promise<void> {
    try {
      // 1. Cari user berdasarkan email
      const user = await this.userRepository.findByEmail(email.toLowerCase());
      if (!user) {
        // Jangan beri tahu bahwa email tidak ditemukan untuk keamanan
        return;
      }

      // 2. Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 jam

      // 3. Simpan token ke database
      await this.userRepository.updateResetToken(
        user.id,
        resetToken,
        resetTokenExpiry
      );

      // 4. Kirim email reset password
      await this.sendResetEmail(email, resetToken);
    } catch (error) {
      throw new Error("Failed to process forgot password request");
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // 1. Verify token
      const tokenData = await this.verifyResetToken(token);

      // 2. Hash password baru
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // 3. Update password dan clear reset token
      await this.userRepository.updatePassword(
        tokenData.userId,
        hashedPassword
      );
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to reset password");
    }
  }

  async verifyResetToken(
    token: string
  ): Promise<{ userId: number; email: string }> {
    try {
      // Query ke database untuk cek token
      const user = await this.userRepository.findByResetToken(token);

      if (!user) {
        throw new Error("Invalid reset token");
      }

      // Cek apakah token expired
      if (!user.reset_token_expires || new Date() > user.reset_token_expires) {
        throw new Error("Reset token has expired");
      }

      return {
        userId: user.id,
        email: user.email,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to verify reset token");
    }
  }

  private async sendResetEmail(email: string, token: string): Promise<void> {
    // Implementasi pengiriman email
    // Anda bisa menggunakan nodemailer, sendgrid, atau email service lainnya

    // Contoh dengan console log untuk development
    const resetLink = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/reset-password?token=${token}`;

    console.log("=== PASSWORD RESET EMAIL ===");
    console.log("To:", email);
    console.log("Reset Link:", resetLink);
    console.log("Token expires in 1 hour");
    console.log("============================");

    // TODO: Implementasi email service yang sebenarnya
    // const emailService = new EmailService();
    // await emailService.sendResetPasswordEmail(email, resetLink);

    // Untuk sementara, anggap email berhasil dikirim
    // Di production, uncomment dan implementasi email service di atas
  }
}

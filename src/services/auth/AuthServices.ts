import bcrypt from "bcrypt";
import { SignJWT } from "jose";
import crypto from "crypto";
import { UserRepository } from "../../repositories/UserRepository";
import { UserRole } from "../../types/user";
import { ErrorValidation } from "@/types";
import { ServicesReturn } from "@/types";
import {
  RegisterRequest,
  LoginRequest,
  ForgotPasswordRequest,
  VerifyTokenRequest,
  ResetPasswordRequest,
} from "@/types/auth";
import { sendResetPasswordEmail } from "../emailService";

export class AuthService {
  private userRepo: UserRepository;
  private JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

  constructor() {
    this.userRepo = new UserRepository();
  }

  private async generateJWT(user: any): Promise<string> {
    const token = await new SignJWT({
      id: user.id,
      role: user.role,
      name: user.name, // Sesuai dengan path database
      email: user.email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d") // Token berlaku 7 hari
      .sign(this.JWT_SECRET);

    return token;
  }

  async login(
    data: LoginRequest
  ): Promise<
    { error: null; token: string; user: any } | { error: ErrorValidation }
  > {
    const { email, password } = data;

    // transaction DB
    await this.userRepo.qr.connect();
    await this.userRepo.qr.startTransaction();

    try {
      const user = await this.userRepo.findByEmail(email);

      if (!user) {
        return {
          error: {
            path: "email",
            msg: "Email tidak ditemukan",
          },
        };
      }

      // Validasi password
      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        return {
          error: {
            path: "password",
            msg: "Password salah",
          },
        };
      }

      // Generate JWT token
      const token = await this.generateJWT(user);

      // update last login
      const updateUser = await this.userRepo.updateLastLogin(user.id);

      // commit transaction
      await this.userRepo.qr.commitTransaction();

      return { error: null, token: token, user: user };
    } catch (error) {
      // rollback transaction on error
      await this.userRepo.qr.rollbackTransaction();
      throw error;
    } finally {
      // release query runner
      await this.userRepo.qr.release();
    }
  }

  async register(
    data: RegisterRequest
  ): Promise<
    { error: null; token: string; user: any } | { error: ErrorValidation }
  > {
    // transaction DB
    await this.userRepo.qr.connect();
    await this.userRepo.qr.startTransaction();

    try {
      const { nim, email, password, semester, whatsapp_number, name } = data;

      const nimExist = await this.userRepo.findByNimWithStudent(nim);
      const emailExist = await this.userRepo.findByEmail(email);

      // email harus berakhiran @student.itera.ac.id
      // if (!email.endsWith("@student.itera.ac.id")) {
      //   return {
      //     error: {
      //       path: "email",
      //       msg: "Email harus @student.itera.ac.id",
      //     },
      //   };
      // }

      if (nimExist) {
        return {
          error: { path: "nim", msg: "NIM sudah terdaftar" },
        };
      }
      if (emailExist) {
        return {
          error: { path: "email", msg: "Email sudah terdaftar" },
        };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user data
      const userData = {
        role: "student" as UserRole,
        semester: semester,
        name: name,
        email: email,
        password: hashedPassword,
        is_active: true,
        whatsapp_number: whatsapp_number,
      };

      // Create student data
      const studentData = {
        nim: nim,
        semester: semester,
      };

      // Save user using repository
      const newUser = await this.userRepo.createUserWithStudent(
        userData,
        studentData
      );

      // commit transaction
      await this.userRepo.qr.commitTransaction();

      // Auto-login after register
      const loginResult = await this.login({ email, password });

      // If login failed, return the error
      if ("error" in loginResult && loginResult.error) {
        return {
          error: { path: loginResult.error.path, msg: loginResult.error.msg },
        };
      }

      return { error: null, token: loginResult.token, user: newUser };
    } catch (error) {
      // rollback transaction on error
      await this.userRepo.qr.rollbackTransaction();
      throw error;
    } finally {
      // release query runner
      await this.userRepo.qr.release();
    }
  }

  async forgotPassword(
    data: ForgotPasswordRequest
  ): Promise<{ error: null } | { error: ErrorValidation }> {
    // transaction DB
    await this.userRepo.qr.connect();
    await this.userRepo.qr.startTransaction();
    try {
      const { email } = data;
      const user = await this.userRepo.findByEmail(email);

      if (!user) {
        return {
          error: { path: "email", msg: "Email tidak ditemukan" },
        };
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpires = new Date();
      resetTokenExpires.setHours(resetTokenExpires.getHours() + 1); // Token berlaku 1 jam

      // Update user dengan reset token
      await this.userRepo.update(user.id, {
        reset_token: resetToken,
        reset_token_expires: resetTokenExpires,
      });

      try {
        // Sending email
        const emailSent = await sendResetPasswordEmail(
          user.email,
          resetToken,
          user.name
        );

        if (!emailSent) {
          return {
            error: {
              path: "email",
              msg: "Gagal mengirim email reset password",
            },
          };
        }
      } catch (emailError: unknown) {
        // Rollback: hapus reset token jika email gagal
        await this.userRepo.update(user.id, {
          reset_token: undefined,
          reset_token_expires: undefined,
        });

        console.error("Failed to send email:", emailError);
      }

      // commit transaction
      await this.userRepo.qr.commitTransaction();

      return { error: null };
    } catch (error) {
      // rollback transaction on error
      await this.userRepo.qr.rollbackTransaction();
      throw error;
    }
  }

  async verifyResetToken(
    data: VerifyTokenRequest
  ): Promise<{ error: null } | { error: ErrorValidation }> {
    //   transaction DB
    await this.userRepo.qr.connect();
    await this.userRepo.qr.startTransaction();
    try {
      const { token } = data;
      if (!token) {
        return {
          error: { path: "token", msg: "Token tidak ditemukan" },
        };
      }

      const user = await this.userRepo.findByResetToken(token.trim());

      if (!user) {
        return {
          error: { path: "token", msg: "Token tidak valid atau kadaluarsa" },
        };
      }
      // commit transaction
      await this.userRepo.qr.commitTransaction();
      return { error: null };
    } catch (error) {
      // rollback transaction on error
      await this.userRepo.qr.rollbackTransaction();
      throw error;
    }
  }

  async resetPassword(
    data: ResetPasswordRequest
  ): Promise<{ error: null } | { error: ErrorValidation }> {
    try {
      const { token, password } = data;

      if (!token) {
        return {
          error: { path: "token", msg: "Token tidak ditemukan" },
        };
      }

      const user = await this.userRepo.findByResetToken(token.trim());

      if (!user) {
        return {
          error: {
            path: "token",
            msg: "Token tidak valid",
          },
        };
      }

      if (!user.reset_token_expires || user.reset_token_expires < new Date()) {
        return {
          error: {
            path: "token",
            msg: "Token kadaluarsa",
          },
        };
      }

      if (!password) {
        return {
          error: { path: "password", msg: "Password harus diisi" },
        };
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 12);

      // update password dan clear reset token
      await this.userRepo.update(user.id, {
        password: hashedPassword,
        reset_token: undefined,
        reset_token_expires: undefined,
      });

      return { error: null };
    } catch (error) {
      throw error;
    }
  }
}

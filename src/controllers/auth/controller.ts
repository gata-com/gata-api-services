import { Route, Get, Post, Body, Controller, SuccessResponse } from "tsoa";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import AppDataSource from "../../config/database";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "secretkey";

@Route("auth")
export class AuthController extends Controller {
  @Post("login")
  @SuccessResponse("200", "Login berhasil") // Define success response
  public async login(
    @Body() requestBody: { email: string; password: string }
  ): Promise<any> {
    try {
      const { email, password } = requestBody;

      // Validasi input
      if (!email || !password) {
        this.setStatus(400);
        return {
          message: "Email dan password wajib diisi",
          token: "",
          user: null,
        };
      }

      // Cari user dengan raw query TypeORM
      const users = await AppDataSource.query(
        "SELECT * FROM users WHERE email = ?",
        [email]
      );

      if (users.length === 0) {
        this.setStatus(400);
        return {
          message: "Email tidak ditemukan",
          token: "",
          user: null,
        };
      }

      const user = users[0];

      // Validasi password
      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        this.setStatus(400);
        return {
          message: "Password salah",
          token: "",
          user: null,
        };
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          nama: user.nama, // Sesuai dengan field database
          nim: user.nim,
          role: user.role,
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

      return {
        message: "Login berhasil",
        token,
        user: {
          userId: user.id,
          nama: user.nama,
          email: user.email,
          nim: user.nim,
          role: user.role,
        },
      };
    } catch (error: any) {
      console.error("Error in login:", error);
      this.setStatus(500);
      return {
        message: "Terjadi kesalahan",
        token: "",
        user: null,
      };
    }
  }
}

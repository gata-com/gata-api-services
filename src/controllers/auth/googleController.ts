import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "@/entities/user";
import { AuthRequest } from "@/types";
import { UserRepository } from "@/repositories/UserRepository";

const userRepository = new UserRepository();

// Generate JWT token
const generateToken = (user: User) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );
};

// Google Auth Callback Handler
export const googleAuthCallback = async (req: Request, res: Response) => {
  try {
    const user = req.user as User;

    const token = generateToken(user);

    // cookie for middleware authentication
    const isProduction = process.env.NODE_ENV === "production";
    const useHttps = process.env.USE_HTTPS === "true";

    const cookieOptions: any = {
      httpOnly: true,
      secure: isProduction && useHttps, // Must be true for sameSite: "none"
      sameSite: isProduction && useHttps ? "none" : "lax", // "none" requires secure: true
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    // Add domain if set (use parent domain like .gata.web.id for cross-subdomain)
    // Leave empty to default to current domain only
    if (process.env.COOKIE_DOMAIN) {
      let domain = process.env.COOKIE_DOMAIN.replace(
        /^https?:\/\//,
        ""
      ).replace(/\/$/, "");
      cookieOptions.domain = domain;
    }

    res.cookie("token", token, cookieOptions);
    // Redirect ke frontend dengan token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (error) {
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?error=AuthenticationFailed`
    );
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await userRepository.findById(req.user!.id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

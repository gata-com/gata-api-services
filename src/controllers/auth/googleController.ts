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

    // Save token in the cookie (more secure)
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

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

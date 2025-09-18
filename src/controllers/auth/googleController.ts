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

    // Redirect ke frontend dengan token
    res.redirect(`${process.env.FRONTEND_URL}/auth/login?token=${token}`);
  } catch (error) {
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/login?error=AuthenticationFailed`
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

export const logout = (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    return res.json({ message: "Logged out successfully" });
  });
};

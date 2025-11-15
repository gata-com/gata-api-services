import { Request, Response } from "express";
import { ApiResponse } from "@/types";

export const logout = async (req: Request, res: Response<ApiResponse>) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  res.status(200).json({ message: "Logged out successfully" });
};

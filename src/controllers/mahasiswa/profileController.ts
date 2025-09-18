// controllers/mahasiswa/profileController.ts
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import path from "path";
import fs from "fs/promises";
import {
  getProfileService,
  updateProfileService,
  // Comment dulu services yang belum diimplementasi
  // changePasswordService,
  // getStatusPengajuanService,
  // requestPembimbingChangeService,
  // updateJudulTAService
} from "../../services/profileService";
import { AuthRequest } from "@/types";

// Get Profile
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    console.log("🔍 getProfile - req.user:", req.user);

    const mahasiswaId = req.user?.userId; // Ganti dari id ke userId

    if (!mahasiswaId) {
      console.log("❌ req.user.userId is undefined");
      res.status(401).json({
        success: false,
        message: "User tidak terautentikasi",
      });
      return;
    }

    console.log("🔍 Getting profile for mahasiswaId:", mahasiswaId);
    const profile = await getProfileService(mahasiswaId);

    if (!profile) {
      res.status(404).json({
        success: false,
        message: "Profile tidak ditemukan",
      });
      return;
    }

    console.log("✅ Profile found:", profile);
    res.status(200).json({
      success: true,
      message: "Profile berhasil diambil",
      data: profile,
    });
  } catch (err: any) {
    console.log("❌ getProfile error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Terjadi kesalahan internal server",
    });
  }
};

// Update Profile
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const mahasiswaId = req.user?.userId; // Ganti dari id ke userId
    const { nama, nim, nomorWhatsapp, email } = req.body;

    if (!mahasiswaId) {
      res.status(401).json({
        success: false,
        message: "User tidak terautentikasi",
      });
      return;
    }

    // Validasi data yang diperlukan
    if (!nama || !nim || !nomorWhatsapp || !email) {
      res.status(400).json({
        success: false,
        message: "Nama, NIM, nomor WhatsApp, dan email wajib diisi",
      });
      return;
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: "Format email tidak valid",
      });
      return;
    }

    // Validasi NIM (hanya angka)
    if (!/^\d+$/.test(nim)) {
      res.status(400).json({
        success: false,
        message: "NIM harus berupa angka",
      });
      return;
    }

    // Validasi nomor WhatsApp
    if (!/^\d{10,15}$/.test(nomorWhatsapp)) {
      res.status(400).json({
        success: false,
        message: "Nomor WhatsApp harus 10-15 digit angka",
      });
      return;
    }

    const updatedProfile = await updateProfileService(mahasiswaId, {
      name: nama,
      nim,
      whatsapp_number: nomorWhatsapp,
      email,
    });

    res.status(200).json({
      success: true,
      message: "Profile berhasil diupdate",
      data: updatedProfile,
    });
    return;
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || "Terjadi kesalahan internal server",
    });
    return;
  }
};

// PLACEHOLDER FUNCTIONS untuk sementara - implement nanti
export const uploadProfilePicture = async (req: AuthRequest, res: Response) => {
  res.status(501).json({
    success: false,
    message: "Upload profile picture belum diimplementasi",
  });
};

export const deleteProfilePicture = async (req: AuthRequest, res: Response) => {
  res.status(501).json({
    success: false,
    message: "Delete profile picture belum diimplementasi",
  });
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  res.status(501).json({
    success: false,
    message: "Change password belum diimplementasi",
  });
};

export const getStatusPengajuan = async (req: AuthRequest, res: Response) => {
  res.status(501).json({
    success: false,
    message: "Get status pengajuan belum diimplementasi",
  });
};

export const requestPembimbingChange = async (
  req: AuthRequest,
  res: Response
) => {
  res.status(501).json({
    success: false,
    message: "Request pembimbing change belum diimplementasi",
  });
};

export const updateJudulTA = async (req: AuthRequest, res: Response) => {
  res.status(501).json({
    success: false,
    message: "Update judul TA belum diimplementasi",
  });
};

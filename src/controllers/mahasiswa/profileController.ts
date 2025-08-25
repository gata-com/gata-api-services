// controllers/mahasiswa/profileController.ts
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import path from "path";
import fs from "fs/promises";
import { 
  getProfileService,
  updateProfileService
  // Comment dulu services yang belum diimplementasi
  // changePasswordService,
  // getStatusPengajuanService,
  // requestPembimbingChangeService,
  // updateJudulTAService
} from "../../services/profileService";

interface AuthRequest extends Request {
  user?: {
    userId: number;     // Gunakan userId sesuai dengan middleware auth
    role: string;
  };
}

// Get Profile
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🔍 getProfile - req.user:', req.user);
    
    const mahasiswaId = req.user?.userId; // Ganti dari id ke userId
    
    if (!mahasiswaId) {
      console.log('❌ req.user.userId is undefined');
      return res.status(401).json({
        success: false,
        message: "User tidak terautentikasi"
      });
    }

    console.log('🔍 Getting profile for mahasiswaId:', mahasiswaId);
    const profile = await getProfileService(mahasiswaId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile tidak ditemukan"
      });
    }

    console.log('✅ Profile found:', profile);
    return res.status(200).json({
      success: true,
      message: "Profile berhasil diambil",
      data: profile
    });

  } catch (err: any) {
    console.log('❌ getProfile error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || "Terjadi kesalahan internal server"
    });
  }
};

// Update Profile
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const mahasiswaId = req.user?.userId; // Ganti dari id ke userId
    const { nama, nim, nomorWhatsapp, email } = req.body;

    if (!mahasiswaId) {
      return res.status(401).json({
        success: false,
        message: "User tidak terautentikasi"
      });
    }

    // Validasi data yang diperlukan
    if (!nama || !nim || !nomorWhatsapp || !email) {
      return res.status(400).json({
        success: false,
        message: "Nama, NIM, nomor WhatsApp, dan email wajib diisi"
      });
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Format email tidak valid"
      });
    }

    // Validasi NIM (hanya angka)
    if (!/^\d+$/.test(nim)) {
      return res.status(400).json({
        success: false,
        message: "NIM harus berupa angka"
      });
    }

    // Validasi nomor WhatsApp
    if (!/^\d{10,15}$/.test(nomorWhatsapp)) {
      return res.status(400).json({
        success: false,
        message: "Nomor WhatsApp harus 10-15 digit angka"
      });
    }

    const updatedProfile = await updateProfileService(mahasiswaId, {
      nama,
      nim,
      nomorWhatsapp,
      email
    });

    return res.status(200).json({
      success: true,
      message: "Profile berhasil diupdate",
      data: updatedProfile
    });

  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || "Terjadi kesalahan internal server"
    });
  }
};

// PLACEHOLDER FUNCTIONS untuk sementara - implement nanti
export const uploadProfilePicture = async (req: AuthRequest, res: Response) => {
  res.status(501).json({
    success: false,
    message: "Upload profile picture belum diimplementasi"
  });
};

export const deleteProfilePicture = async (req: AuthRequest, res: Response) => {
  res.status(501).json({
    success: false,
    message: "Delete profile picture belum diimplementasi"
  });
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  res.status(501).json({
    success: false,
    message: "Change password belum diimplementasi"
  });
};

export const getStatusPengajuan = async (req: AuthRequest, res: Response) => {
  res.status(501).json({
    success: false,
    message: "Get status pengajuan belum diimplementasi"
  });
};

export const requestPembimbingChange = async (req: AuthRequest, res: Response) => {
  res.status(501).json({
    success: false,
    message: "Request pembimbing change belum diimplementasi"
  });
};

export const updateJudulTA = async (req: AuthRequest, res: Response) => {
  res.status(501).json({
    success: false,
    message: "Update judul TA belum diimplementasi"
  });
};
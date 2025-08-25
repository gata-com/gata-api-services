// services/profileService.ts
import bcrypt from "bcrypt";
import { UserRepository } from "../repositories/userRepository"; // Import repository yang sudah ada

const userRepository = new UserRepository();

// Types (tetap sama)
interface ProfileData {
  id?: number;
  nama?: string;
  nim?: string;
  nomorWhatsapp?: string;
  email?: string;
  profilePicture?: string | null;
  pembimbing1?: {
    id: number;
    nama: string;
    nip: string;
  } | null;
  pembimbing2?: {
    id: number;
    nama: string;
    nip: string;
  } | null;
  judulTA?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// Get Profile Service - IMPLEMENTASI REAL
export const getProfileService = async (
  mahasiswaId: number
): Promise<ProfileData | null> => {
  try {
    // Menggunakan UserRepository yang sudah ada
    const user = await userRepository.findById(mahasiswaId);

    if (!user) {
      return null;
    }

    // Return data profile (sesuaikan dengan field yang ada di user entity)
    return {
      id: user.id,
      nama: user.nama || user.nama, // sesuaikan dengan field di database
      nim: user.nim,
      nomorWhatsapp: user.nomorWhatsapp || user.nomorWhatsapp, // sesuaikan field name
      email: user.email,
      //   profilePicture: user.profilePicture || null,
      // pembimbing1: null, // implement later jika ada relasi
      // pembimbing2: null, // implement later jika ada relasi
      // judulTA: null, // implement later jika ada relasi
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } catch (error) {
    console.error("Error in getProfileService:", error);
    throw error;
  }
};

// Update Profile Service - IMPLEMENTASI BASIC
export const updateProfileService = async (
  mahasiswaId: number,
  updateData: Partial<ProfileData>
): Promise<ProfileData | null> => {
  try {
    // Cek apakah user exists
    const existingUser = await userRepository.findById(mahasiswaId);

    if (!existingUser) {
      return null;
    }

    // Untuk sementara, jika tidak ada method update, return current profile
    // Nanti akan diimplementasi setelah UserRepository lengkap
    console.log("Update data:", updateData);

    // Return current profile (temporary)
    return await getProfileService(mahasiswaId);
  } catch (error) {
    console.error("Error in updateProfileService:", error);
    throw error;
  }
};

// Untuk service lainnya, biarkan dulu sebagai placeholder atau implement basic version

export type UserRole = "student" | "admin" | "lecturer";

// Kelompok keahlian untuk dosen
export type ExpertisesGroup = "RPLSI" | "AIDE" | "KMSI";

export interface CreateUserData {
  nim: string;
  semester?: number; // Made optional to match entity
  name: string;
  whatsapp_number?: string;
  email: string;
  password: string;
  // role?: UserRole;
  // ExpertisesGroup?: ExpertisesGroup; // Added for dosen
  // resetToken?: string; // Changed to camelCase to match entity
  // resetTokenExpires?: Date; // Changed to camelCase to match entity
  isActive?: boolean;
}

export interface UpdateUserData {
  // nama?: string;
  // semester?: number;
  // nomorWhatsapp?: string;
  email?: string;
  password?: string;
  // role?: UserRole; // Added role update capability
  // kelompokKeahlian?: ExpertisesGroup; // Added for dosen
  // resetToken?: string; // Added for password reset functionality
  // resetTokenExpires?: Date; // Added for password reset functionality
  // isActive?: boolean;
  // lastLogin?: Date; // Added for login tracking
}

export interface UserQueryParams {
  role?: UserRole;
  semester?: number;
  kelompokKeahlian?: ExpertisesGroup; // Added for filtering dosen
  isActive?: boolean;
  search?: string;
  sortBy?: "createdAt" | "updatedAt" | "nama" | "nim" | "email" | "lastLogin"; // Added sorting options
  sortOrder?: "ASC" | "DESC"; // Added sort order
  page?: string; // Added for pagination
  limit?: string; // Added for pagination
}

// Additional useful interfaces
export interface UserResponse {
  id: number;
  nim: string;
  nama: string;
  semester?: number;
  nomorWhatsapp?: string;
  email: string;
  role: UserRole;
  kelompokKeahlian?: ExpertisesGroup; // Added for dosen
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterRequest {
  name: string;
  nim: string;
  email: string;
  password: string;
  semester?: string;
  whatsapp_number?: string;
}

// export interface RegisterStudentRequest extends RegisterRequest {
//   semester?: number; // Required for students
// }

export interface RegisterDosenRequest
  extends Omit<RegisterRequest, "semester"> {
  kelompokKeahlian: ExpertisesGroup; // Required for dosen
}

export interface RegisterAdminRequest
  extends Omit<RegisterRequest, "semester"> {
  // Admin tidak punya semester
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    nama: string;
    nim: string;
    email: string;
    role: UserRole;
    semester?: number;
    nomorWhatsapp?: string;
    isActive: boolean;
    createdAt: Date;
  };
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ResetPasswordConfirmRequest {
  token: string;
  newPassword: string;
}

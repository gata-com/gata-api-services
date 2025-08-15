export type UserRole = 'student' | 'admin' | 'dosen';

export interface CreateUserData {
  nim: string;
  nama: string;
  semester: number;
  nomorWhatsapp: string;
  email: string;
  password: string;
  role?: UserRole;
  reset_token?: string;
  reset_token_expiry?: Date;
  isActive?: boolean;
}

export interface UpdateUserData {
  nama?: string;
  semester?: number;
  nomorWhatsapp?: string;
  email?: string;
  password?: string;
  isActive?: boolean;
}

export interface UserQueryParams {
  role?: UserRole;
  semester?: number;
  isActive?: boolean;
  search?: string;
}
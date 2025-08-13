export type UserRole = 'student' | 'admin';

export interface CreateUserData {
  nim: string;
  nama: string;
  semester: number;
  nomorWhatsapp: string;
  email: string;
  password: string;
  role?: UserRole;
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
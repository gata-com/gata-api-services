import { JwtPayload as BaseJwtPayload } from 'jsonwebtoken';

export interface RegisterRequest {
  nim: string;
  nama: string;
  semester: number;
  nomorWhatsapp: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Extend the base JwtPayload from jsonwebtoken
export interface JwtPayload extends BaseJwtPayload {
  userId: number;
  role?: string;
}

// For token generation (without iat, exp which are added by jwt.sign)
export interface TokenPayload {
  userId: number;
  role?: string;
}

export interface AuthResponse {
  user: {
    id: number;
    nim: string;
    nama: string;
    semester: number;
    email: string;
    role: string;
    lastLogin?: Date;
  };
  token: string;
}
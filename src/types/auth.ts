import { JwtPayload as BaseJwtPayload } from "jsonwebtoken";

/*=====================
  Student Interfaces
=================*/

export interface RegisterRequest {
  nim: string;
  semester: number;
  name: string;
  whatsapp_number?: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyTokenRequest {
  token: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
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

// Reset Password Interfaces
export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyTokenRequest {
  token: string;
}

// Extend the base JwtPayload from jsonwebtoken
export interface JwtPayload extends BaseJwtPayload {
  id: string;
  role: string;
  name: string;
  email: string;
}

// For token generation (without iat, exp which are added by jwt.sign)
export interface TokenPayload {
  userId: number;
  role?: string;
}

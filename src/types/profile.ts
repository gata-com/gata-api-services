// types/profile.ts
export interface ProfileUpdateRequest {
  nama?: string;
  nim?: string;
  nomorWhatsapp?: string;
  email?: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PembimbingChangeRequestData {
  pembimbingType: 'pembimbing1' | 'pembimbing2';
  alasan: string;
  dosenBaru?: number;
}

export interface JudulTAUpdateRequest {
  judul: string;
}
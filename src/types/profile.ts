// types/profile.ts
export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PembimbingChangeRequestData {
  pembimbingType: "pembimbing1" | "pembimbing2";
  alasan: string;
  dosenBaru?: number;
}

export interface JudulTAUpdateRequest {
  judul: string;
}

export interface ProfileUpdateRequest {
  name: string;
  email: string;
  nip: string;
  initials: string;
  whatsapp_number?: string;
  password?: string;
  expertise_group_1: number | null;
  expertise_group_2: number | null;
  expertise_group_3: number | null;
  expertise_group_4: number | null;
  signature_data?: string;
}

// Interface untuk forgot password request
export interface ForgotPasswordRequest {
  email: string;
}

// Interface untuk reset password request
export interface ResetPasswordRequest {
  token: string;
  new_password: string;
  confirm_password: string;
}

// Interface untuk response
export interface ResetPasswordResponse {
  success: boolean;
  message: string;
  data?: any;
  errors?: any[]; // Tambah errors property
}

// Interface untuk verify token
export interface VerifyTokenResponse {
  success: boolean;
  message: string;
  email?: string;
  valid?: boolean;
  errors?: any[]; // Tambah errors property
}

// Interface untuk email template variables
export interface EmailTemplateVariables {
  [key: string]: string;
}

// Constants untuk template names
export const EMAIL_TEMPLATES = {
  RESET_PASSWORD: 'reset-password',
  WELCOME: 'welcome',
  NOTIFICATION: 'notification'
} as const;
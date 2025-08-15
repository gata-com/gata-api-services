import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'student_management',
    synchronize: process.env.DB_SYNC === 'true',
    logging: process.env.DB_LOGGING === 'true',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d', 
  },
  
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),

  // Email Configuration untuk Reset Password - TAMBAHAN BARU
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '', // App password untuk Gmail
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@yourapp.com'
  },

  // App URLs - TAMBAHAN BARU
  app: {
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    backendUrl: process.env.BACKEND_URL || 'http://localhost:5000'
  },

  // Reset Password Settings - TAMBAHAN BARU
  resetPassword: {
    tokenExpiryMinutes: parseInt(process.env.RESET_TOKEN_EXPIRY_MINUTES || '10', 10), // 10 minutes
    tokenLength: parseInt(process.env.RESET_TOKEN_LENGTH || '32', 10) // 32 bytes = 64 hex chars
  }
} as const;

// Email Configuration Interface
export interface EmailConfig {
  service: string;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
}

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'DB_PASSWORD'];

// Add email vars for production
if (process.env.NODE_ENV === 'production') {
  requiredEnvVars.push('EMAIL_USER', 'EMAIL_PASSWORD', 'FRONTEND_URL');
}

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.warn(`⚠️  Missing environment variables: ${missingEnvVars.join(', ')}`);
  
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  }
}
import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000", 10),

  database: {
    // Database type - default to MySQL (changed from SQLite)
    type: process.env.DB_TYPE as "mysql",

    // MySQL Properties (only used if DB_TYPE=mysql)
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,

    // Common Properties - MySQL optimized defaults
    synchronize: !isProduction, // Disable synchronize in production
    logging: process.env.DB_LOGGING === "true",

    // MySQL specific connection options
    connectionTimeout: parseInt(
      process.env.DB_CONNECTION_TIMEOUT || "60000",
      10
    ),
    acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT || "60000", 10),
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || "20", 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET || "fallback-secret-key",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },

  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || "12", 10),

  // Email Configuration untuk Reset Password
  email: {
    service: process.env.EMAIL_SERVICE || "gmail",
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    user: process.env.SMTP_USER || "",
    password: process.env.SMTP_PASS || "", // App password untuk Gmail
    from:
      process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@yourapp.com",
  },

  // App URLs
  app: {
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
    backendUrl: process.env.BACKEND_URL || "http://localhost:5000",
  },

  // Reset Password Settings
  resetPassword: {
    tokenExpiryMinutes: parseInt(
      process.env.RESET_TOKEN_EXPIRY_MINUTES || "10",
      10
    ), // 10 minutes
    tokenLength: parseInt(process.env.RESET_TOKEN_LENGTH || "32", 10), // 32 bytes = 64 hex chars
  },

  // Rate limiting
  rateLimiting: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10), // 100 requests per window
  },
} as const;

// Database Configuration Interface
export interface DatabaseConfig {
  type: "mysql";
  // SQLite
  database?: string;
  // MySQL
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  name?: string;
  // Common
  synchronize: boolean;
  logging: boolean;
  connectionTimeout?: number;
  acquireTimeout?: number;
  maxConnections?: number;
}

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
const requiredEnvVars = ["JWT_SECRET"];

// Since MySQL is now default, always validate MySQL vars unless explicitly SQLite
if (config.database.type === "mysql" || !process.env.DB_TYPE) {
  requiredEnvVars.push("DB_PASSWORD", "DB_HOST", "DB_NAME");

  // Additional MySQL-specific validation
  if (!process.env.DB_USERNAME) {
    console.warn("⚠️ DB_USERNAME not set, using default: root");
  }

  if (!process.env.DB_PORT) {
    console.warn("⚠️ DB_PORT not set, using default: 3306");
  }
}

// Add email vars for production
if (process.env.NODE_ENV === "production") {
  requiredEnvVars.push("SMTP_USER", "SMTP_PASS", "FRONTEND_URL");
}

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.warn(
    `⚠️  Missing environment variables: ${missingEnvVars.join(", ")}`
  );

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      `Missing required environment variables: ${missingEnvVars.join(", ")}`
    );
  }
}

// Enhanced database configuration logging
// console.log("=== DATABASE CONFIGURATION ===");
// console.log(`🗄️  Database type: ${config.database.type}`);

// console.log(`🏠 MySQL host: ${config.database.host}:${config.database.port}`);
// console.log(`🏷️  MySQL database: ${config.database.name}`);
// console.log(`👤 MySQL username: ${config.database.username}`);
// console.log(`🔄 MySQL synchronize: ${config.database.synchronize}`);
// console.log(`📝 MySQL logging: ${config.database.logging}`);
// console.log(
//   `⏱️  MySQL connection timeout: ${config.database.connectionTimeout}ms`
// );
// console.log(`🔗 MySQL max connections: ${config.database.maxConnections}`);

// console.log(`🌍 Environment: ${config.nodeEnv}`);
// console.log(`🚀 Server port: ${config.port}`);
// console.log("================================");

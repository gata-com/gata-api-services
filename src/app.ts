import "reflect-metadata";
import express, { Application, Request, Response } from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { config } from "./config/config";
import { ApiResponse, ErrorResponse } from "./types";
import session from "express-session";
import passport from "./config/google";

// swagger UI
import swaggerUi from "swagger-ui-express";
import * as swaggerDocument from "./swagger/swagger.json";

// Import your configured database (but don't initialize here)
import AppDataSource from "./config/database";

// Route imports
import authRoutes from "./routes/auth";
// import userRoutes from "./routes/users";
import mahasiswaRoutes from "./routes/mahasiswa";
import adminRoutes from "./routes/admin";

// Load environment variables
dotenv.config();

const app: Application = express();

// ======================
// Security Middleware
// ======================
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

// CORS configuration
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? [process.env.FRONTEND_URL || "https://your-production-domain.com"]
        : [process.env.FRONTEND_URL || "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Logging middleware
if (config.nodeEnv === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Body parsing middleware
app.use(
  express.json({
    limit: "10mb",
    type: ["application/json", "text/plain"],
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Trust proxy (for real IP detection)
app.set("trust proxy", 1);

// Passport
app.use(passport.initialize());
app.use(passport.session());

// ======================
// Setup Path absolute storages
// ======================

const finalProjectsPath = path.join(
  process.cwd(),
  "src",
  "storages",
  "final-projects"
);

app.use("/final-projects", express.static(finalProjectsPath));
// ======================
// Routes
// ======================

// Swagger UI Setup
if (process.env.NODE_ENV !== "production") {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      explorer: true,
      customSiteTitle: "GATA API Docs",
    })
  );
}

// Root endpoint with enhanced info
app.get("/", (req: Request, res: Response) => {
  const response: ApiResponse = {
    message: "GATA Server",
    data: {
      version: "1.0.0",
      environment: config.nodeEnv,
      databaseType: AppDataSource.options.type,
      serverTime: new Date().toISOString(),
      endpoints: {
        documentation: "/api-docs",
        health: "/api/health",
        auth: "/api/auth",
        users: "/api/users",
        mahasiswa: "/api/mahasiswa",
        resetPassword: "/api/auth/reset-password",
        forgotPassword: "/api/auth/forgot-password",
        pendaftaranTA: "/api/mahasiswa/daftar-ta",
        profile: "/api/mahasiswa/profile",
      },
    },
  };
  res.status(200).json(response);
});

// API routes
app.use("/api/auth", authRoutes);
// app.use("/api/users", userRoutes);
app.use("/api/mahasiswa", mahasiswaRoutes);
app.use("/api/admin", adminRoutes);

// Enhanced health check endpoint
app.get("/api/health", async (req: Request, res: Response) => {
  try {
    const dbType = AppDataSource.options.type;
    let dbInfo: string;
    let dbStatus: string;

    // Check database connection
    if (AppDataSource.isInitialized) {
      try {
        // Test database connection
        if (dbType === "mysql") {
          await AppDataSource.query("SELECT 1");
          dbStatus = "Connected";
          const options = AppDataSource.options as any;
          dbInfo = `${options.host}:${options.port}/${options.database}`;
        } else {
          dbStatus = "Connected";
          dbInfo = (AppDataSource.options as any).database;
        }
      } catch (dbError) {
        dbStatus = "Connection Error";
        dbInfo = dbError instanceof Error ? dbError.message : "Unknown error";
      }
    } else {
      dbStatus = "Not Initialized";
      dbInfo = "Database not initialized";
    }

    const response: ApiResponse = {
      message: "Server health check",
      data: {
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        environment: config.nodeEnv,
        nodeVersion: process.version,
        platform: process.platform,
        database: {
          status: dbStatus,
          type: dbType,
          info: dbInfo,
          synchronize: (AppDataSource.options as any).synchronize,
          logging: (AppDataSource.options as any).logging,
        },
        memory: {
          used:
            Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + " MB",
          total:
            Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + " MB",
        },
      },
    };

    res.status(200).json(response);
  } catch (error) {
    const errorResponse: ErrorResponse = {
      success: false,
      message: "Health check failed",
      statusCode: 500,
      path: req.path,
      timestamp: new Date().toISOString(),
      error: {
        code: "HEALTH_CHECK_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    };
    res.status(500).json(errorResponse);
  }
});

// Database status endpoint (detailed)
app.get("/api/db-status", async (req: Request, res: Response) => {
  try {
    if (!AppDataSource.isInitialized) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: "Database not initialized",
        statusCode: 503,
        path: req.path,
        timestamp: new Date().toISOString(),
        error: {
          code: "DATABASE_NOT_INITIALIZED",
          message: "Database connection not established",
        },
      };
      return res.status(503).json(errorResponse);
    }

    let connectionInfo: any = {};

    if (AppDataSource.options.type === "mysql") {
      // Test MySQL connection with detailed info
      const [result] = await AppDataSource.query(
        "SELECT CONNECTION_ID() as connection_id, USER() as user, DATABASE() as database"
      );
      connectionInfo = {
        connectionId: result.connection_id,
        user: result.user,
        database: result.database,
        host: (AppDataSource.options as any).host,
        port: (AppDataSource.options as any).port,
      };
    }

    const response: ApiResponse = {
      message: "Database status check",
      data: {
        type: AppDataSource.options.type,
        isInitialized: AppDataSource.isInitialized,
        connectionInfo,
        options: {
          synchronize: (AppDataSource.options as any).synchronize,
          logging: (AppDataSource.options as any).logging,
          charset: (AppDataSource.options as any).charset,
          timezone: (AppDataSource.options as any).timezone,
        },
        timestamp: new Date().toISOString(),
      },
    };

    return res.status(200).json(response);
  } catch (error) {
    const errorResponse: ErrorResponse = {
      success: false,
      message: "Database status check failed",
      statusCode: 500,
      path: req.path,
      timestamp: new Date().toISOString(),
      error: {
        code: "DATABASE_STATUS_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    };
    return res.status(500).json(errorResponse);
  }
});

// ======================
// Error Handling
// ======================

// 404 handler
app.all("*", (req: Request, res: Response) => {
  const response: ErrorResponse = {
    success: false,
    message: `Route ${req.originalUrl} not found`,
    statusCode: 404,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
    suggestions: [
      "/api/auth/login",
      "/api/auth/register",
      "/api/users",
      "/api/mahasiswa/daftar-ta",
      "/api/auth/reset-password",
      "/api/health",
    ],
    error: {
      code: "ROUTE_NOT_FOUND",
      message: `${req.method} ${req.originalUrl} not found`,
    },
  };
  res.status(404).json(response);
});

export default app;

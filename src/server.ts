import "reflect-metadata";
import app from "./app";
import AppDataSource, {
  initializeDatabase,
  closeDatabase,
} from "./config/database";
import { config } from "./config/config";
import { initializeCronJobs } from "./jobs";

const PORT = config.port || 5000;

// Database health check function
const checkDatabaseHealth = async (retries = 3): Promise<boolean> => {
  for (let i = 0; i < retries; i++) {
    try {
      if (AppDataSource.isInitialized) {
        if (config.database.type === "mysql") {
          await AppDataSource.query("SELECT 1");
        }
        return true;
      }
    } catch (error) {
      console.warn(
        `🔍 Database health check failed (attempt ${i + 1}/${retries}):`,
        error
      );
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
      }
    }
  }
  return false;
};

// Start server with enhanced error handling
const startServer = async () => {
  try {
    // Initialize database with retry logic
    await initializeDatabase();

    // Verify database health
    const isHealthy = await checkDatabaseHealth();
    if (!isHealthy) {
      throw new Error("Database health check failed after initialization");
    }

    console.log("✅ Database is healthy and ready");

    // Initialize scheduled jobs
    initializeCronJobs();

    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`🎯 API Server listening on port ${PORT}`);
    });

    // Enhanced graceful shutdown
    const shutdown = async (signal: string) => {
      // console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

      // Set a timeout for forced shutdown
      const forceShutdown = setTimeout(() => {
        console.error("❌ Forced shutdown due to timeout");
        process.exit(1);
      }, 30000); // 30 seconds timeout

      server.close(async (err: any) => {
        if (err) {
          console.error("❌ Error closing HTTP server:", err);
        } else {
          // console.log("✅ HTTP server closed");
        }

        try {
          // Close database connections
          // console.log("🔄 Closing database connections...");
          await closeDatabase();
          // console.log("✅ Database connections closed");

          clearTimeout(forceShutdown);
          // console.log("🎯 Graceful shutdown completed");
          process.exit(0);
        } catch (error) {
          console.error("❌ Error during graceful shutdown:", error);
          clearTimeout(forceShutdown);
          process.exit(1);
        }
      });

      // Stop accepting new connections
      server.closeAllConnections?.();
    };

    // Register shutdown handlers
    process.on("SIGTERM", () => {
      console.log("🛑 Received SIGTERM signal");
      shutdown("SIGTERM");
    });
    process.on("SIGINT", () => {
      console.log("🛑 Received SIGINT signal");
      shutdown("SIGINT");
    });

    // Database connection monitoring (for MySQL)
    if (config.database.type === "mysql") {
      const monitorInterval = setInterval(async () => {
        try {
          if (!(await checkDatabaseHealth(1))) {
            console.error(
              "❌ Database health check failed - connection might be lost"
            );
            // You could implement reconnection logic here
          }
        } catch (error) {
          console.error("❌ Database monitoring error:", error);
        }
      }, 60000); // Check every minute

      // Clear monitoring on shutdown
      process.on("SIGTERM", () => clearInterval(monitorInterval));
      process.on("SIGINT", () => clearInterval(monitorInterval));
    }

    return server;
  } catch (error) {
    console.error("❌ Failed to start server:", error);

    if (error instanceof Error) {
      console.error("🔍 Error details:", {
        name: error.name,
        message: error.message,
        stack: config.nodeEnv === "development" ? error.stack : undefined,
      });

      // MySQL specific error suggestions
      if (error.message.includes("ECONNREFUSED")) {
        console.error("💡 Suggestion: Make sure MySQL server is running");
      } else if (error.message.includes("ER_ACCESS_DENIED_ERROR")) {
        console.error("💡 Suggestion: Check database credentials in .env file");
      } else if (error.message.includes("ER_BAD_DB_ERROR")) {
        console.error('💡 Suggestion: Create database "gataDB" first:');
        console.error(
          "   CREATE DATABASE gataDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
        );
      }
    }

    process.exit(1);
  }
};

// Enhanced error handling for unhandled promises and exceptions
process.on("unhandledRejection", (err: Error, promise) => {
  // console.log("💥 UNHANDLED PROMISE REJECTION! Shutting down...");
  console.error("Promise:", promise);
  console.error("Reason:", err);

  if (config.nodeEnv === "development") {
    console.error("Stack trace:", err.stack);
  }

  // Close server gracefully
  process.exit(1);
});

process.on("uncaughtException", (err: Error) => {
  console.log("💥 UNCAUGHT EXCEPTION! Shutting down...");
  console.error("Error name:", err.name);
  console.error("Error message:", err.message);

  if (config.nodeEnv === "development") {
    console.error("Stack trace:", err.stack);
  }

  process.exit(1);
});

// Memory usage monitoring (development only)
if (config.nodeEnv === "development") {
  setInterval(() => {
    const memUsage = process.memoryUsage();
    const formatBytes = (bytes: number) =>
      Math.round(bytes / 1024 / 1024) + " MB";

    console.log("📊 Memory Usage:", {
      rss: formatBytes(memUsage.rss),
      heapTotal: formatBytes(memUsage.heapTotal),
      heapUsed: formatBytes(memUsage.heapUsed),
      external: formatBytes(memUsage.external),
    });
  }, 300000); // Every 5 minutes
}

// Start the server
(async () => {
  try {
    await startServer();
  } catch (error) {
    console.error("❌ Critical startup error:", error);
    process.exit(1);
  }
})();

import 'reflect-metadata';
import app from './app';
import { AppDataSource } from './config/database';
import { config } from './config/config';

const PORT = config.port || 5000;

// Initialize database connection
const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('🗄️  Database connected successfully');
    
    // Auto-run migrations in development
    if (config.nodeEnv === 'development' && config.database.synchronize) {
      await AppDataSource.synchronize();
      console.log('📊 Database synchronized');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  await initializeDatabase();
  
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} in ${config.nodeEnv} mode`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
    
    server.close(async () => {
      console.log('🔄 HTTP server closed');
      
      if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
        console.log('🗄️  Database connection closed');
      }
      
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  
  return server;
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.log('💥 UNHANDLED REJECTION! Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.log('💥 UNCAUGHT EXCEPTION! Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
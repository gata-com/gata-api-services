import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from './config';
import * as path from 'path';
import * as fs from 'fs';

// Create data directory if needed (for SQLite fallback)
const createDataDirectory = () => {
  if (config.database.type === 'sqlite' && config.database.database) {
    const dbPath = config.database.database;
    const dir = path.dirname(dbPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  }
};

// Create data source configuration based on database type
const createDataSourceConfig = (): DataSourceOptions => {
  console.log('=== DATABASE CONFIG DEBUG ===');
  console.log('🔍 DB_TYPE from env:', process.env.DB_TYPE);
  console.log('🔍 config.database.type:', config.database.type);
  console.log('🔍 Database name:', config.database.type === 'mysql' ? config.database.name : config.database.database);
  
  const baseConfig = {
    synchronize: false,
    logging: config.database.logging,
    entities: [__dirname + '/../entities/*.{ts,js}'],
    migrations: [__dirname + '/../migrations/*.{ts,js}'],
    subscribers: [__dirname + '/../subscribers/*.{ts,js}'],
    migrationsRun: true,
  };

  if (config.database.type === 'sqlite') {
    console.log('✅ Creating SQLite configuration');
    const sqliteConfig: DataSourceOptions = {
      type: 'sqlite',
      database: config.database.database || './data/student_management.sqlite',
      ...baseConfig,
      cache: true,
      dropSchema: false,
      extra: {
        pragma: [
          'PRAGMA foreign_keys = ON;'
        ]
      }
    };
    return sqliteConfig;
  } else {
    console.log('✅ Creating MySQL configuration');
    const mysqlConfig: DataSourceOptions = {
      type: 'mysql',
      host: config.database.host,
      port: config.database.port,
      username: config.database.username,
      password: config.database.password,
      database: config.database.name,
      ...baseConfig,
      // MySQL specific options - OPTIMIZED
      charset: 'utf8mb4',
      timezone: '+07:00', // WIB timezone untuk Indonesia
      connectTimeout: 60000,
      acquireTimeout: 60000,
      extra: {
        connectionLimit: 20,
        queueLimit: 0,
        // Connection flags untuk MySQL
        ssl: false,
        // Improve performance
        dateStrings: false,
        typeCast: true,
        // Handle disconnections
        reconnect: true,
        // Timeout settings
        timeout: 60000,
      },
      // Enable connection pooling
      cache: {
        duration: 30000, // 30 seconds
      },
    };
    console.log('📋 MySQL config created for database:', config.database.name);
    return mysqlConfig;
  }
};

// Create data directory (for SQLite fallback)
createDataDirectory();

console.log('🚀 Creating AppDataSource...');
const AppDataSource = new DataSource(createDataSourceConfig());
console.log('✅ AppDataSource created');

// PENTING: Hapus export const dan hanya gunakan export default
// export const AppDataSource = new DataSource(createDataSourceConfig()); // HAPUS INI

export const initializeDatabase = async (): Promise<void> => {
  try {
    console.log('🔄 Starting database initialization...');
    console.log('🔍 AppDataSource isInitialized:', AppDataSource.isInitialized);
    console.log('🔍 AppDataSource options type:', AppDataSource.options.type);
    
    if (config.database.type === 'mysql') {
      console.log(`🏠 Connecting to MySQL: ${config.database.host}:${config.database.port}/${config.database.name}`);
    }
    
    if (!AppDataSource.isInitialized) {
      console.log('📡 Initializing database connection...');
      await AppDataSource.initialize();
      console.log(`✅ ${config.database.type.toUpperCase()} database connected successfully`);
      
      if (config.database.type === 'sqlite') {
        console.log(`📁 Database file: ${config.database.database}`);
      } else {
        console.log(`🏠 Connected to: ${config.database.host}:${config.database.port}/${config.database.name}`);
      }

      // For MySQL, check if we need to create tables
      if (config.database.type === 'mysql' && config.database.synchronize) {
        console.log('🔄 MySQL synchronize enabled - checking schema...');
      }

      // Run pending migrations if any
      try {
        const pendingMigrations = await AppDataSource.showMigrations();
        if (pendingMigrations) {
          console.log('📝 Running pending migrations...');
          await AppDataSource.runMigrations();
          console.log('✅ Migrations completed');
        } else {
          console.log('ℹ️ No pending migrations');
        }
      } catch (migrationError) {
        console.warn('⚠️ Migration check failed (this is normal for new databases):', migrationError);
      }
    } else {
      console.log('⚠️ Database already initialized');
    }
  } catch (error) {
    console.error('❌ Database connection error:', error);
    if (error instanceof Error) {
      console.error('🔍 Error type:', error.constructor.name);
      console.error('🔍 Error message:', error.message);
      
      // MySQL specific error handling
      if (error.message.includes('ECONNREFUSED')) {
        console.error('💡 Suggestion: Make sure MySQL server is running');
      } else if (error.message.includes('ER_ACCESS_DENIED_ERROR')) {
        console.error('💡 Suggestion: Check username and password');
      } else if (error.message.includes('ER_BAD_DB_ERROR')) {
        console.error('💡 Suggestion: Database "gataDB" might not exist. Create it first:');
        console.error('   CREATE DATABASE gataDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
      }
    }
    throw error;
  }
};

export const closeDatabase = async (): Promise<void> => {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('✅ Database connection closed');
    }
  } catch (error) {
    console.error('❌ Error closing database:', error);
    throw error;
  }
};

export const getDatabase = () => {
  if (!AppDataSource.isInitialized) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return AppDataSource;
};

// Helper function to backup database (MySQL dump)
export const backupDatabase = async (backupPath?: string): Promise<string> => {
  if (config.database.type === 'sqlite') {
    const dbPath = config.database.database || './data/student_management.sqlite';
    const backup = backupPath || `${dbPath}.backup.${Date.now()}`;
    
    try {
      if (fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, backup);
        console.log(`✅ SQLite Database backed up to: ${backup}`);
        return backup;
      } else {
        throw new Error(`Database file not found: ${dbPath}`);
      }
    } catch (error) {
      console.error('❌ Backup failed:', error);
      throw error;
    }
  } else {
    // For MySQL, you would typically use mysqldump
    const backup = backupPath || `./backups/gataDB_backup_${Date.now()}.sql`;
    const backupDir = path.dirname(backup);
    
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    console.log(`💡 For MySQL backup, use: mysqldump -u ${config.database.username} -p ${config.database.name} > ${backup}`);
    return backup;
  }
};

// HANYA SATU EXPORT DEFAULT - INI YANG DIBACA TYPEORM CLI
export default AppDataSource;
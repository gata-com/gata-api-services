import { DataSource } from 'typeorm';
import { config } from './config';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.name,
  synchronize: config.database.synchronize,
  logging: config.database.logging,
  entities: [__dirname + '/../entities/*.{ts,js}'], // load semua entity
  migrations: [__dirname + '/../migrations/*.{ts,js}'],
  subscribers: [__dirname + '/../subscribers/*.{ts,js}'],
  charset: 'utf8mb4',
  timezone: '+00:00',
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('Database connected successfully');
    }
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
};

export const getDatabase = () => {
  if (!AppDataSource.isInitialized) {
    throw new Error('Database not initialized');
  }
  return AppDataSource;
};

export default AppDataSource;

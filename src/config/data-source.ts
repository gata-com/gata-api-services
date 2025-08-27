import { DataSource } from 'typeorm';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const AppDataSource = new DataSource({
  type: 'mysql', // ganti sesuai database kamu
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gataDB',
  synchronize: false,
  logging: false,
  entities: ['src/entities/**/*.{ts,js}'],
  migrations: ['src/migrations/**/*.{ts,js}'],
  subscribers: ['src/subscribers/**/*.{ts,js}'],
});

export default AppDataSource;
import 'reflect-metadata';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { errorHandler } from './middleware/errorHandler';
import { ApiResponse, ErrorResponse } from './types';

// Route imports
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import mahasiswaRoutes from './routes/mahasiswa';

// Entity imports (make sure you import your entities here)
import { User } from './entities/user';
import { Mahasiswa } from './entities/mahasiswa';
import { PendaftaranTA } from './entities/pendaftaranTA';

// Load environment variables
dotenv.config();

const app: Application = express();

// ======================
// Middleware
// ======================
app.use(helmet());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? ['https://yourdomain.com']
        : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  })
);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ======================
// Database Connection
// ======================
export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gata',
  synchronize: true, // ❗ change to false in production, use migrations instead
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Mahasiswa, PendaftaranTA],
});

// Initialize DB before starting server
AppDataSource.initialize()
  .then(() => {
    console.log('✅ Database connected successfully');
  })
  .catch((err) => {
    console.error('❌ Error during Data Source initialization:', err);
  });

// ======================
// Routes
// ======================

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    message: 'INI API NYA COBA COBA',
    data: {
      documentation: '/api-docs',
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      resetPassword: '/api/auth/reset-password',
      forgotPassword: '/api/auth/forgot-password',
      pendaftaranTA: '/api/mahasiswa/pendaftaran-ta',
    },
  };
  res.status(200).json(response);
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/mahasiswa', mahasiswaRoutes);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    message: 'Server is running',
    data: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: AppDataSource.isInitialized ? 'Connected' : 'Not connected',
    },
  };
  res.status(200).json(response);
});

// ======================
// Error Handling
// ======================

// 404 handler
app.all('*', (req: Request, res: Response<ErrorResponse>) => {
  const response: ErrorResponse = {
    success: false,
    message: `Route ${req.originalUrl} not found`,
    statusCode: 404,
    suggestions: [
      '/api/auth/login',
      '/api/auth/register',
      '/api/users',
      '/api/mahasiswa/pendaftaran-ta',
      'resetPassword: /api/auth/reset-password',
    ],
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  };
  res.status(404).json(response);
});

// Global error handling middleware
app.use(errorHandler);

export default app;

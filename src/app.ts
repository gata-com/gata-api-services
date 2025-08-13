import 'reflect-metadata';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { ApiResponse, ErrorResponse } from './types'; // Added ErrorResponse to imports

// Route imports
import authRoutes from './routes/auth';
import userRoutes from './routes/users';

// Load environment variables
dotenv.config();

const app: Application = express();

// ======================
// Middleware
// ======================
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
      users: '/api/users'
    }
  };
  res.status(200).json(response);
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    message: 'Server is running',
    data: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: 'MySQL with TypeORM'
    }
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
      '/api/users'
    ],
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  };
  res.status(404).json(response);
});

// Global error handling middleware
app.use(errorHandler);

export default app;
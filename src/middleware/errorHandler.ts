import { Request, Response, NextFunction } from 'express';
import { ApiResponse, ErrorResponse, ApiErrorDetail } from '../types';
import { config } from '../config/config';
import { QueryFailedError } from 'typeorm';

interface CustomError extends Error {
  statusCode?: number;
  code?: string;
  errno?: number;
  sqlMessage?: string;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;
  let statusCode = err.statusCode || 500;

  // Log error
  console.error('💥 Error:', err);

  // TypeORM/MySQL specific errors
  if (err instanceof QueryFailedError) {
    // MySQL duplicate entry error
    if (err.driverError?.code === 'ER_DUP_ENTRY') {
      error.message = 'Duplicate entry. Resource already exists';
      statusCode = 409;
    }
    // MySQL foreign key constraint error
    else if (err.driverError?.code === 'ER_NO_REFERENCED_ROW_2') {
      error.message = 'Referenced resource does not exist';
      statusCode = 400;
    }
    // MySQL data too long error
    else if (err.driverError?.code === 'ER_DATA_TOO_LONG') {
      error.message = 'Data too long for field';
      statusCode = 400;
    }
    // Generic database error
    else {
      error.message = 'Database operation failed';
      statusCode = 500;
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    statusCode = 401;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error.message = 'Validation failed';
    statusCode = 400;
  }

  // Cast errors (invalid ID format)
  if (err.name === 'CastError') {
    error.message = 'Invalid resource ID format';
    statusCode = 400;
  }

  const errorDetail: ApiErrorDetail = {
    code: err.name || 'UNKNOWN_ERROR',
    message: error.message,
    ...(err.stack && { stack: err.stack }),
    ...(err instanceof QueryFailedError && {
      ...(err.driverError?.sqlMessage && { sqlMessage: err.driverError.sqlMessage }),
      ...(err.query && { query: err.query }),
      ...(err.parameters && { parameters: err.parameters })
    })
  };

  const response: ErrorResponse = {
    success: false,
    message: error.message || 'Internal Server Error',
    statusCode,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
    ...(config.nodeEnv === 'development' && { error: errorDetail })
  };

  res.status(statusCode).json(response);
};

// Async error handler wrapper with proper typing
export const asyncHandler = <T = any>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
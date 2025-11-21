import { Request } from "express";
import { UserRole } from "./user";

// Base API response structure
export interface ApiResponse<T = unknown> {
  success?: boolean;
  message: string;
  data?: T;
  errors?: ErrorValidation | ErrorValidation[];
  error?: string;
  pagination?: PaginationMeta;
}

export interface ErrorValidation {
  path: string;
  msg: string;
}

export interface ServicesReturn {
  error: null;
  data: any;
  pagination?: PaginationMeta;
}

// Pagination metadata
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Detailed error information
export interface ApiErrorDetail {
  code: string;
  message: string;
  field?: string;
  value?: unknown;
  stack?: string;
  path?: string;
  timestamp?: string;
}

// Extended Express Request with user context
export interface AuthRequest extends Request {
  user?: any;
}

// Pagination request parameters
export interface PaginationQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  search?: string;
}

// Paginated response structure
export interface PaginationResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

// Common query parameters
export interface BaseQueryParams {
  search?: string;
}

// JWT payload structure
export interface JwtPayload {
  userId: number;
  role?: UserRole;
  iat?: number;
  exp?: number;
}

// Standard error response format
export interface ErrorResponse extends Omit<ApiResponse<null>, "errors"> {
  success: false;
  statusCode: number;
  path: string;
  timestamp: string;
  suggestions?: string[];
  errors?: ApiErrorDetail;
}

// Validation error specifics
export interface ValidationErrorDetail extends ApiErrorDetail {
  code: "VALIDATION_ERROR";
  field: string;
  value?: unknown;
  constraints?: Record<string, string>;
}

export interface ValidationError extends ApiErrorDetail {
  code: "VALIDATION_ERROR";
  field: string;
  constraints?: Record<string, string>;
}

// Database operation error
export interface DatabaseError extends ApiErrorDetail {
  code: "DATABASE_ERROR";
  query?: string;
  parameters?: unknown[];
  driverError?: unknown;
}

// Extended Error for API exceptions
export interface ApiError extends Error {
  code: string;
  statusCode: number;
  details?: unknown;
  timestamp: string;
  path?: string;
}

// Type for paginated request queries
export interface PaginatedRequestQuery extends PaginationQuery {
  [key: string]: unknown;
}

// Export user types only (remove auth types if they're duplicated)
export * from "./user";

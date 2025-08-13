import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { UserRepository } from '../repositories/userRepository';
import { AuthRequest, ApiResponse } from '../types';
import { RegisterRequest, LoginRequest, AuthResponse, TokenPayload } from '../types/auth';
import { config } from '../config/config';

const userRepository = new UserRepository();

// Fixed JWT token generation
const generateToken = (userId: number, role?: string): string => {
  const payload = { userId, role }; // Simplified payload

  return jwt.sign(
    payload,
    config.jwt.secret,
    {
      expiresIn: config.jwt.expiresIn, // MUST be 'expiresIn' (correct spelling)
      algorithm: 'HS256'
    } as jwt.SignOptions
  );
};

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (
  req: Request<{}, ApiResponse<AuthResponse>, RegisterRequest>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }

    const { nim, nama, semester, nomorWhatsapp, email, password } = req.body;

    const existingUser = await userRepository.findByEmailOrNim(email, nim);
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: existingUser.email === email 
          ? 'Email already registered' 
          : 'NIM already registered'
      });
      return;
    }

    const user = await userRepository.create({
      nim,
      nama,
      semester,
      nomorWhatsapp,
      email,
      password
    });

    const token = generateToken(user.id, user.role);

    const response: ApiResponse<AuthResponse> = {
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          nim: user.nim,
          nama: user.nama,
          semester: user.semester,
          email: user.email,
          role: user.role
        },
        token
      }
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (
  req: Request<{}, ApiResponse<AuthResponse>, LoginRequest>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }

    const { email, password } = req.body;
    const user = await userRepository.findByEmailWithPassword(email);

    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator'
      });
      return;
    }

    await userRepository.updateLastLogin(user.id);
    const token = generateToken(user.id, user.role);

    const response: ApiResponse<AuthResponse> = {
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          nim: user.nim,
          nama: user.nama,
          semester: user.semester,
          email: user.email,
          role: user.role,
          lastLogin: new Date()
        },
        token
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await userRepository.findById(req.user!.userId);
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: 'Profile retrieved successfully',
      data: { user }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh
 * @access  Private
 */
export const refreshToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
      return;
    }

    const user = await userRepository.findById(userId);
    
    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
      return;
    }

    const token = generateToken(user.id, user.role);

    const response: ApiResponse<{ token: string }> = {
      success: true,
      message: 'Token refreshed successfully',
      data: { token }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};
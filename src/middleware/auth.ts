import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/userRepository';
import { AuthRequest, ApiResponse } from '../types';
import { JwtPayload } from '../types/auth';
import { config } from '../config/config';

const userRepository = new UserRepository();

export const auth = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.header('Authorization');
    console.log('🔍 Auth Header:', authHeader);
    
    const token = authHeader?.replace('Bearer ', '');
    console.log('🔍 Token:', token);

    if (!token) {
      console.log('❌ No token provided');
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided'
      });
      return;
    }

    const decoded = jwt.verify(token, "your-very-strong-secret-here") as JwtPayload;
    console.log('🔍 Decoded token:', decoded);
    
    const user = await userRepository.findById(decoded.userId);
    console.log('🔍 User found:', user);
    
    if (!user || !user.isActive) {
      console.log('❌ User not found or inactive');
      res.status(401).json({
        success: false,
        message: 'Token is invalid or user is deactivated'
      });
      return;
    }

    // ✅ QUICK FIX: Use type assertion
    (req.user as any) = {
      id: decoded.userId,        // ✅ Set id
      userId: decoded.userId,    // ✅ Keep userId untuk backward compatibility
      email: user.email,         // ✅ Set email
      role: user.role           // ✅ Set role
    };
    
    console.log('✅ req.user set:', req.user);
    next();
  } catch (error) {
    console.log('❌ Auth error:', error);
    res.status(401).json({
      success: false,
      message: 'Token is invalid'
    });
  }
};

export const adminAuth = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required'
    });
    return;
  }
  next();
};

export const studentAuth = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  if (req.user?.role !== 'student') {
    res.status(403).json({
      success: false,
      message: 'Access denied. Student privileges required'
    });
    return;
  }
  next();
};

export const selfOrAdminAuth = async (
  req: AuthRequest<{ id: string }>,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  const targetUserId = parseInt(req.params.id, 10);
  const currentUserId = req.user?.userId;
  const currentUserRole = req.user?.role;

  if (isNaN(targetUserId)) {
    res.status(400).json({
      success: false,
      message: 'Invalid user ID'
    });
    return;
  }

  if (currentUserRole === 'admin' || currentUserId === targetUserId) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own profile'
    });
  }
};
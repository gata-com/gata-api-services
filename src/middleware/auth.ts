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
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided'
      });
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    
    const user = await userRepository.findById(decoded.userId);
    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Token is invalid or user is deactivated'
      });
      return;
    }

    req.user = {
      userId: decoded.userId,
      role: user.role
    };
    
    next();
  } catch (error) {
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
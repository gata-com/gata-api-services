import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { ApiResponse } from '../types';
import { AuthRequest } from '../types';
import { validationResult } from 'express-validator';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  // Get all users with pagination
  getUsers = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    try {
      const result = await this.userService.getAllUsers(req.query as any);
      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve users'
      });
    }
  };

  // Get user statistics
  getUserStats = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    try {
      const stats = await this.userService.getUserStats();
      res.status(200).json({
        success: true,
        message: 'User statistics retrieved successfully',
        data: stats
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve user statistics'
      });
    }
  };

  // Get user by ID
  getUserById = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    try {
      const userId = parseInt(req.params.id, 10);
      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
        return;
      }

      const user = await this.userService.getUserById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: user
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve user'
      });
    }
  };

  // Create new user
  createUser = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    try {
      const user = await this.userService.createUser(req.body);
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create user'
      });
    }
  };

  // Update user
  updateUser = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    try {
      const userId = parseInt(req.params.id, 10);
      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
        return;
      }

      const user = await this.userService.updateUser(userId, req.body);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: user
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update user'
      });
    }
  };

  // Delete user (soft delete)
  deleteUser = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    try {
      const userId = parseInt(req.params.id, 10);
      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
        return;
      }

      await this.userService.deleteUser(userId);
      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete user'
      });
    }
  };

  // Get current user profile
  getProfile = async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const user = await this.userService.getUserById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: user
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve profile'
      });
    }
  };

  // Update current user profile
  updateProfile = async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const user = await this.userService.updateUser(userId, req.body);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: user
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update profile'
      });
    }
  };

  // Forgot password - send reset email
  forgotPassword = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          
        });
        return;
      }

      await this.userService.forgotPassword(req.body.email);
      res.status(200).json({
        success: true,
        message: 'If the email exists, a reset link has been sent'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to process forgot password request'
      });
    }
  };

  // Reset password using token
  resetPassword = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          
        });
        return;
      }

      const { token, newPassword } = req.body;
      await this.userService.resetPassword(token, newPassword);
      
      res.status(200).json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error: any) {
      if (error.message.includes('Invalid') || error.message.includes('expired')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to reset password'
        });
      }
    }
  };

  // Verify reset token validity
  verifyResetToken = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    try {
      const { token } = req.params;
      const result = await this.userService.verifyResetToken(token);
      
      res.status(200).json({
        success: true,
        message: 'Reset token is valid',
        data: result
      });
    } catch (error: any) {
      if (error.message.includes('Invalid') || error.message.includes('expired')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to verify reset token'
        });
      }
    }
  };
}
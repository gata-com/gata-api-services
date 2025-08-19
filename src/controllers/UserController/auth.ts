// controllers/userController/auth.ts
import { Request, Response } from 'express';
import { ApiResponse } from '../../types';
import { BaseUserController } from './base';
import { validationResult } from 'express-validator';

export class AuthUserController extends BaseUserController {
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
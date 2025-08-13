import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { UserRepository } from '../repositories/userRepository';
import { AuthRequest, ApiResponse, PaginationQuery } from '../types';
import { UpdateUserData, UserQueryParams, UserRole } from '../types/user';

const userRepository = new UserRepository();

/**
 * @desc    Get all users with pagination and filters
 * @route   GET /api/users
 * @access  Private/Admin
 */
export const getAllUsers = async (
  req: Request<{}, {}, {}, UserQueryParams & PaginationQuery>,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await userRepository.findAllWithPagination(req.query);

    const response: ApiResponse = {
      success: true,
      message: 'Users retrieved successfully',
      data: result
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Private
 */
export const getUserById = async (
  req: AuthRequest<{ id: string }>,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
      return;
    }

    const user = await userRepository.findById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: 'User retrieved successfully',
      data: { user }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Private
 */
export const updateUser = async (
  req: AuthRequest<{ id: string }, ApiResponse, UpdateUserData>,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        
      });
      return;
    }

    const userId = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
      return;
    }

    const existingUser = await userRepository.findById(userId);

    if (!existingUser) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Check if email is being updated and already exists
    if (req.body.email && req.body.email !== existingUser.email) {
      const emailExists = await userRepository.findByEmail(req.body.email);
      if (emailExists) {
        res.status(409).json({
          success: false,
          message: 'Email already exists'
        });
        return;
      }
    }

    const updatedUser = await userRepository.update(userId, req.body);

    const response: ApiResponse = {
      success: true,
      message: 'User updated successfully',
      data: { user: updatedUser }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete user (soft delete)
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
export const deleteUser = async (
  req: AuthRequest<{ id: string }>,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
      return;
    }

    const user = await userRepository.findById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Prevent admin from deleting themselves
    if (req.user?.userId === userId) {
      res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
      return;
    }

    await userRepository.softDelete(userId);

    const response: ApiResponse = {
      success: true,
      message: 'User deleted successfully'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user statistics
 * @route   GET /api/users/stats
 * @access  Private/Admin
 */
export const getUserStats = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const totalUsers = await userRepository.count();
    const totalStudents = await userRepository.countByRole('student' as UserRole);
    const totalAdmins = await userRepository.countByRole('admin' as UserRole);
    const totalDosen = await userRepository.countByRole('dosen' as UserRole);

    const response: ApiResponse = {
      success: true,
      message: 'User statistics retrieved successfully',
      data: {
        totalUsers,
        totalStudents,
        totalAdmins,
        totalDosen,
        breakdown: {
          students: totalStudents,
          admins: totalAdmins,
          dosen: totalDosen
        }
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};
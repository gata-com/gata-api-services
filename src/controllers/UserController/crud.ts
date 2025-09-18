// controllers/userController/crud.ts
import { Request, Response } from "express";
import { ApiResponse } from "../../types";
import { BaseUserController } from "./base";

export class CrudUserController extends BaseUserController {
  // Get all users with pagination
  getUsers = async (
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> => {
    try {
      const result = await this.userService.getAllUsers(req.query as any);
      res.status(200).json({
        success: true,
        message: "Users retrieved successfully",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve users",
      });
    }
  };

  // Get user statistics
  getUserStats = async (
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> => {
    try {
      const stats = await this.userService.getUserStats();
      res.status(200).json({
        success: true,
        message: "User statistics retrieved successfully",
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve user statistics",
      });
    }
  };

  // Get user by ID
  getUserById = async (
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> => {
    try {
      const userId = parseInt(req.params.id, 10);
      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          message: "Invalid user ID",
        });
        return;
      }

      const user = await this.userService.getUserById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "User retrieved successfully",
        data: user,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve user",
      });
    }
  };

  // Create new user
  // createUser = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  //   try {
  //     const user = await this.userService.createUser(req.body);
  //     res.status(201).json({
  //       success: true,
  //       message: 'User created successfully',
  //       data: user
  //     });
  //   } catch (error: any) {
  //     res.status(400).json({
  //       success: false,
  //       message: error.message || 'Failed to create user'
  //     });
  //   }
  // };

  // Update user
  updateUser = async (
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> => {
    try {
      const userId = parseInt(req.params.id, 10);
      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          message: "Invalid user ID",
        });
        return;
      }

      const user = await this.userService.updateUser(userId, req.body);
      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: user,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to update user",
      });
    }
  };

  // Delete user (soft delete)
  deleteUser = async (
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> => {
    try {
      const userId = parseInt(req.params.id, 10);
      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          message: "Invalid user ID",
        });
        return;
      }

      await this.userService.deleteUser(userId);
      res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to delete user",
      });
    }
  };
}

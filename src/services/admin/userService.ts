import { UserRepository } from "@/repositories/UserRepository";
import User from "@/entities/user";
import { PaginationResult, PaginationQuery } from "@/types";
import bcrypt from "bcryptjs";
import { config } from "@/config/config";

export interface CreateUserRequest {
  role: "student" | "admin" | "lecturer";
  email: string;
  name: string;
  nip?: string;
  nim?: string;
  initials?: string;
  whatsapp_number?: string;
  password?: string;
}

export interface UpdateUserRequest {
  role?: "student" | "admin" | "lecturer";
  name?: string;
  email?: string;
  password?: string;
  whatsapp_number?: string;
  is_active?: boolean;
}

export interface UserQueryParams {
  role?: string;
  is_active?: boolean;
  search?: string;
}

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Get all users with pagination and filtering
   */
  async getAllUsers(query: any): Promise<PaginationResult<any>> {
    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "10", 10);

    // Use the repository's built-in pagination with filters
    const result = await this.userRepository.findAllWithPagination({
      role: query.role,
      search: query.search,
      page: page.toString(),
      limit: limit.toString(),
      sortBy: query.sortBy || "created_at",
      sortOrder: query.sortOrder || "DESC",
    });

    // Transform data to include NIP/NIM and Initials
    const transformedData = await Promise.all(
      result.data.map(async (user) => this.transformUserData(user))
    );

    return {
      data: transformedData,
      pagination: result.pagination,
    };
  }

  /**
   * Transform user data to include NIP/NIM and Initials
   */
  private async transformUserData(user: User): Promise<any> {
    const userData: any = {
      id: user.id,
      googleId: user.googleId,
      role: user.role,
      name: user.name,
      email: user.email,
      whatsapp_number: user.whatsapp_number,
      is_active: user.is_active,
      last_login: user.last_login,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    // Add role-specific fields
    if (user.role !== "student") {
      try {
        const lecturer = await this.userRepository.findLecturerByUserId(
          user.id
        );
        if (lecturer) {
          userData.nip = lecturer.nip;
          userData.initials = lecturer.lecturer_code;
        }
      } catch (error) {
        console.error("Error fetching lecturer data:", error);
      }
    } else if (user.role === "student") {
      try {
        const student = await this.userRepository.findStudentByUserId(user.id);
        if (student) {
          userData.nim = student.nim;
        }
      } catch (error) {
        console.error("Error fetching student data:", error);
      }
    }

    return userData;
  }

  /**
   * Get user by ID
   */
  async getUserById(id: number): Promise<User | null> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }
    return user;
  }

  /**
   * Create new user
   */
  async createUser(data: CreateUserRequest): Promise<User> {
    // Check if email already exists
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error("EMAIL_ALREADY_EXISTS");
    }

    // Create user object
    const userData: Partial<User> = {
      name: data.name,
      email: data.email,
      password: data.password, // Will be hashed by @BeforeInsert decorator
      role: data.role,
      whatsapp_number: data.whatsapp_number,
    };

    // Create user based on role
    let user: User;

    if (data.role !== "student") {
      // Create admin or lecturer with user
      if (!data.nip) {
        throw new Error("NIP_REQUIRED_FOR_LECTURER");
      }

      // Then create lecturer with userId
      const lecturerData = {
        nip: data.nip,
        lecturer_code: data.initials,
      };

      user = await this.userRepository.createUserWithLecturer(
        userData,
        lecturerData
      );
    } else if (data.role === "student") {
      // Create student with user
      const studentData = {
        nim: data.nim,
      };

      user = await this.userRepository.createUserWithStudent(
        userData,
        studentData
      );
    } else {
      // Create admin user
      user = await this.userRepository.create(userData);
    }

    return user;
  }

  /**
   * Update user
   */
  async updateUser(id: number, data: UpdateUserRequest): Promise<User | null> {
    // Check if user exists
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error("USER_NOT_FOUND");
    }

    // Check if email is being changed and if new email already exists
    if (data.email && data.email !== existingUser.email) {
      const userWithEmail = await this.userRepository.findByEmail(data.email);
      if (userWithEmail) {
        throw new Error("EMAIL_ALREADY_EXISTS");
      }
    }

    // Prepare update data
    const updateData: Partial<User> = {};

    if (data.role !== undefined) updateData.role = data.role;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.password !== undefined) {
      // Hash the new password
      updateData.password = await bcrypt.hash(
        data.password,
        config.bcryptSaltRounds
      );
    }
    if (data.whatsapp_number !== undefined)
      updateData.whatsapp_number = data.whatsapp_number;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;

    // Update user
    const updatedUser = await this.userRepository.update(id, updateData);

    return updatedUser;
  }

  /**
   * Delete user (soft delete - set is_active to false)
   */
  async deleteUser(id: number): Promise<boolean> {
    // Check if user exists
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error("USER_NOT_FOUND");
    }

    // Hard Delete user
    const result = await this.userRepository.hardDelete(id);
    return result;
  }

  /**
   * Get user count
   */
  async getUserCount(): Promise<number> {
    return await this.userRepository.count();
  }
}

import { UserRepository } from "@/repositories/UserRepository";
import { ExpertisesGroupRepository } from "@/repositories/ExpertisesGroupRepository";
import bcryptjs from "bcryptjs";
import { config } from "@/config/config";

export class AdminProfileService {
  private userRepository: UserRepository;
  private expertisesGroupRepository: ExpertisesGroupRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.expertisesGroupRepository = new ExpertisesGroupRepository();
  }

  /**
   * Get admin profile by user ID
   */
  async getAdminProfile(userId: number): Promise<any> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    if (user.role !== "admin") {
      throw new Error("USER_IS_NOT_ADMIN");
    }

    // Get lecturer data if admin is also a lecturer
    let nip: string | null = null;
    let initials: string | null = null;
    let expertise_group_1: number | null = null;
    let expertise_group_2: number | null = null;
    let expertise_group_3: number | null = null;
    let expertise_group_4: number | null = null;

    if (user.lecturer) {
      nip = user.lecturer.nip || null;
      initials = user.lecturer.lecturer_code || null;
      // Get expertise groups from lecturer's expertises
      if (user.lecturer.expertises && user.lecturer.expertises.length > 0) {
        user.lecturer.expertises.forEach((exp, index) => {
          if (index === 0) expertise_group_1 = exp.expertises_group?.id || null;
          else if (index === 1)
            expertise_group_2 = exp.expertises_group?.id || null;
          else if (index === 2)
            expertise_group_3 = exp.expertises_group?.id || null;
          else if (index === 3)
            expertise_group_4 = exp.expertises_group?.id || null;
        });
      }
    }

    // Return admin profile data
    const profileData = {
      id: user.id,
      name: user.name,
      email: user.email,
      nip,
      initials,
      whatsapp_number: user.whatsapp_number,
      expertise_group_1,
      expertise_group_2,
      expertise_group_3,
      expertise_group_4,
      is_active: user.is_active,
      last_login: user.last_login,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    return profileData;
  }

  /**
   * Update admin profile
   */
  async updateAdminProfile(
    userId: number,
    data: {
      name?: string;
      email?: string;
      whatsapp_number?: string;
      password?: string;
    }
  ): Promise<any> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    if (user.role !== "admin") {
      throw new Error("USER_IS_NOT_ADMIN");
    }

    // Check email uniqueness if email is being changed
    if (data.email && data.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser) {
        throw new Error("EMAIL_ALREADY_EXISTS");
      }
    }

    // Update user
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.whatsapp_number !== undefined)
      updateData.whatsapp_number = data.whatsapp_number;
    if (data.password !== undefined && data.password.trim() !== "") {
      updateData.password = await bcryptjs.hash(
        data.password,
        config.bcryptSaltRounds
      );
    }

    const updatedUser = await this.userRepository.update(userId, updateData);

    return updatedUser;
  }

  /**
   * Get all expertises groups
   */
  async getAllExpertisesGroups(): Promise<any[]> {
    return await this.expertisesGroupRepository.findAll();
  }
}

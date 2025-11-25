import { UserRepository } from "@/repositories/UserRepository";
import { LecturerRepository } from "@/repositories/LecturerRepository";
import { LecturerExpertiseRepository } from "@/repositories/LecturerExpertiseRepository";
import { ExpertisesGroupRepository } from "@/repositories/ExpertisesGroupRepository";
import bcryptjs from "bcryptjs";
import { config } from "@/config/config";

export class LecturerProfileService {
  private userRepository: UserRepository;
  private lecturerRepository: LecturerRepository;
  private lecturerExpertiseRepository: LecturerExpertiseRepository;
  private expertisesGroupRepository: ExpertisesGroupRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.lecturerRepository = new LecturerRepository();
    this.lecturerExpertiseRepository = new LecturerExpertiseRepository();
    this.expertisesGroupRepository = new ExpertisesGroupRepository();
  }

  /**
   * Get lecturer profile by user ID
   */
  async getLecturerProfile(userId: number): Promise<any> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    if (!user.lecturer) {
      throw new Error("LECTURER_DATA_NOT_FOUND");
    }

    // Get expertise groups from lecturer's expertises
    let expertise_group_1: number | null = null;
    let expertise_group_2: number | null = null;
    let expertise_group_3: number | null = null;
    let expertise_group_4: number | null = null;

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

    // Return lecturer profile data
    const profileData = {
      id: user.id,
      name: user.name,
      email: user.email,
      nip: user.lecturer.nip,
      initials: user.lecturer.lecturer_code,
      whatsapp_number: user.whatsapp_number,
      expertise_group_1,
      expertise_group_2,
      expertise_group_3,
      expertise_group_4,
      current_supervised_1: user.lecturer.current_supervised_1,
      current_supervised_2: user.lecturer.current_supervised_2,
      max_supervised_1: user.lecturer.max_supervised_1,
      max_supervised_2: user.lecturer.max_supervised_2,
      is_active: user.is_active,
      last_login: user.last_login,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    return profileData;
  }

  /**
   * Update lecturer profile
   */
  async updateLecturerProfile(
    userId: number,
    data: {
      name?: string;
      email?: string;
      nip?: string;
      initials?: string;
      whatsapp_number?: string;
      expertise_group_1?: number | null;
      expertise_group_2?: number | null;
      expertise_group_3?: number | null;
      expertise_group_4?: number | null;
      password?: string;
    }
  ): Promise<any> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    if (!user.lecturer) {
      throw new Error("LECTURER_DATA_NOT_FOUND");
    }

    // Check email uniqueness if email is being changed
    if (data.email && data.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser) {
        throw new Error("EMAIL_ALREADY_EXISTS");
      }
    }

    // Check NIP uniqueness if NIP is being changed
    if (data.nip && data.nip !== user.lecturer.nip) {
      const existingLecturer = await this.lecturerRepository.findByNip(
        data.nip
      );
      if (existingLecturer) {
        throw new Error("NIP_ALREADY_EXISTS");
      }
    }

    // Update user data
    const updateUserData: any = {};
    if (data.name !== undefined) updateUserData.name = data.name;
    if (data.email !== undefined) updateUserData.email = data.email;
    if (data.whatsapp_number !== undefined)
      updateUserData.whatsapp_number = data.whatsapp_number;
    if (data.password !== undefined && data.password.trim() !== "") {
      updateUserData.password = await bcryptjs.hash(
        data.password,
        config.bcryptSaltRounds
      );
    }

    // Update lecturer data (NIP, initials)
    const updateLecturerData: any = {};
    if (data.nip !== undefined) updateLecturerData.nip = data.nip;
    if (data.initials !== undefined)
      updateLecturerData.lecturer_code = data.initials;

    // Update user in database
    if (Object.keys(updateUserData).length > 0) {
      await this.userRepository.update(userId, updateUserData);
    }

    // Update lecturer in database
    if (Object.keys(updateLecturerData).length > 0) {
      await this.lecturerRepository.update(
        user.lecturer.id,
        updateLecturerData
      );
    }

    // Handle expertise groups update
    const expertiseGroupIds = [
      data.expertise_group_1,
      data.expertise_group_2,
      data.expertise_group_3,
      data.expertise_group_4,
    ].filter((id) => id !== undefined && id !== null);

    if (expertiseGroupIds.length > 0) {
      // Delete all existing expertise records for this lecturer
      await this.lecturerExpertiseRepository.deleteByLecturerId(
        user.lecturer.id
      );

      // Create new expertise records
      for (const expertiseGroupId of expertiseGroupIds) {
        const expertiseGroup = await this.expertisesGroupRepository.findById(
          expertiseGroupId
        );

        if (!expertiseGroup) {
          throw new Error(`EXPERTISE_GROUP_NOT_FOUND_${expertiseGroupId}`);
        }

        await this.lecturerExpertiseRepository.create({
          lecturer: user.lecturer,
          expertises_group: expertiseGroup,
        });
      }
    }

    // Return updated profile
    const updatedUser = await this.userRepository.findById(userId);
    if (!updatedUser || !updatedUser.lecturer) {
      throw new Error("FAILED_TO_RETRIEVE_UPDATED_DATA");
    }

    return this.formatProfileData(updatedUser);
  }

  /**
   * Format profile data
   */
  private formatProfileData(user: any): any {
    let expertise_group_1: number | null = null;
    let expertise_group_2: number | null = null;
    let expertise_group_3: number | null = null;
    let expertise_group_4: number | null = null;

    if (
      user.lecturer &&
      user.lecturer.expertises &&
      user.lecturer.expertises.length > 0
    ) {
      user.lecturer.expertises.forEach((exp: any, index: number) => {
        if (index === 0) expertise_group_1 = exp.expertises_group?.id || null;
        else if (index === 1)
          expertise_group_2 = exp.expertises_group?.id || null;
        else if (index === 2)
          expertise_group_3 = exp.expertises_group?.id || null;
        else if (index === 3)
          expertise_group_4 = exp.expertises_group?.id || null;
      });
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      nip: user.lecturer?.nip || null,
      initials: user.lecturer?.lecturer_code || null,
      whatsapp_number: user.whatsapp_number,
      expertise_group_1,
      expertise_group_2,
      expertise_group_3,
      expertise_group_4,
      current_supervised_1: user.lecturer?.current_supervised_1 || 0,
      current_supervised_2: user.lecturer?.current_supervised_2 || 0,
      max_supervised_1: user.lecturer?.max_supervised_1 || 15,
      max_supervised_2: user.lecturer?.max_supervised_2 || 15,
      is_active: user.is_active,
      last_login: user.last_login,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  /**
   * Get all expertises groups
   */
  async getAllExpertisesGroups(): Promise<any[]> {
    return await this.expertisesGroupRepository.findAll();
  }
}

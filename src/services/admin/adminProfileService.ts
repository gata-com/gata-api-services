import { UserRepository } from "@/repositories/UserRepository";
import { ExpertisesGroupRepository } from "@/repositories/ExpertisesGroupRepository";
import { LecturerRepository } from "@/repositories/LecturerRepository";
import { SignatureRepository } from "@/repositories/SignatureRepository";
import { LecturerExpertiseRepository } from "@/repositories/LecturerExpertiseRepository";
import { SignatureService } from "./signatureService";
import bcryptjs from "bcryptjs";
import { config } from "@/config/config";
import { ProfileUpdateRequest } from "@/types/profile";

export class AdminProfileService {
  private userRepository: UserRepository;
  private expertisesGroupRepository: ExpertisesGroupRepository;
  private lecturerRepository: LecturerRepository;
  private signatureRepository: SignatureRepository;
  private lecturerExpertiseRepository: LecturerExpertiseRepository;
  private signatureService: SignatureService;

  constructor() {
    this.userRepository = new UserRepository();
    this.expertisesGroupRepository = new ExpertisesGroupRepository();
    this.lecturerRepository = new LecturerRepository();
    this.signatureRepository = new SignatureRepository();
    this.lecturerExpertiseRepository = new LecturerExpertiseRepository();
    this.signatureService = new SignatureService();
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
    let signature_url: string | null = null;

    if (user.lecturer) {
      nip = user.lecturer.nip || null;
      initials = user.lecturer.lecturer_code || null;

      // Get expertise groups from lecturer's expertises (sorted by position)
      if (user.lecturer.expertises && user.lecturer.expertises.length > 0) {
        // Sort by position to maintain order
        const sortedExpertises = [...user.lecturer.expertises].sort(
          (a, b) => ((a as any).position || 0) - ((b as any).position || 0)
        );

        sortedExpertises.forEach((exp, index) => {
          if (index === 0) expertise_group_1 = exp.expertises_group?.id || null;
          else if (index === 1)
            expertise_group_2 = exp.expertises_group?.id || null;
          else if (index === 2)
            expertise_group_3 = exp.expertises_group?.id || null;
          else if (index === 3)
            expertise_group_4 = exp.expertises_group?.id || null;
        });
      }

      // Get signature URL (file path only, not base64)
      if (user.lecturer.signature) {
        signature_url = user.lecturer.signature.signature_url || null;
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
      signature_url,
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
    data: ProfileUpdateRequest
  ): Promise<any> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    if (user.role !== "admin") {
      throw new Error("USER_IS_NOT_ADMIN");
    }

    if (!user.lecturer) {
      throw new Error("LECTURER_NOT_FOUND");
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

    if (Object.keys(updateUserData).length > 0) {
      await this.userRepository.update(userId, updateUserData);
    }

    // Update lecturer data (NIP and initials)
    const updateLecturerData: any = {};
    if (data.nip !== undefined) updateLecturerData.nip = data.nip;
    if (data.initials !== undefined)
      updateLecturerData.lecturer_code = data.initials;

    if (Object.keys(updateLecturerData).length > 0) {
      await this.lecturerRepository.update(
        user.lecturer.id,
        updateLecturerData
      );
    }

    // Update expertise groups
    await this.updateExpertiseGroups(user.lecturer.id, [
      data.expertise_group_1,
      data.expertise_group_2,
      data.expertise_group_3,
      data.expertise_group_4,
    ]);

    // Update signature if provided
    if (
      data.signature_data !== undefined &&
      data.signature_data.trim() !== ""
    ) {
      await this.updateSignature(user.lecturer.id, data.signature_data);
    }

    // Return updated profile
    return await this.getAdminProfile(userId);
  }

  /**
   * Update lecturer expertise groups with explicit order to prevent mixing
   */
  private async updateExpertiseGroups(
    lecturerId: number,
    expertiseGroupIds: (number | null)[]
  ): Promise<void> {
    // Delete all existing expertises
    await this.lecturerExpertiseRepository.deleteByLecturerId(lecturerId);

    // Add new expertises with explicit position/order
    // Position: 1 = expertise_group_1, 2 = expertise_group_2, etc
    for (let index = 0; index < expertiseGroupIds.length; index++) {
      const expertiseGroupId = expertiseGroupIds[index];
      if (expertiseGroupId !== null) {
        // position = index + 1 (1-based indexing)
        const position = index + 1;

        const lecturerExpertiseData = {
          lecturer: { id: lecturerId } as any,
          expertises_group: { id: expertiseGroupId } as any,
        };

        // Add position field jika repository support
        (lecturerExpertiseData as any).position = position;

        await this.lecturerExpertiseRepository.create(lecturerExpertiseData);

        console.log(
          `✓ Added expertise group ${expertiseGroupId} at position ${position} for lecturer ${lecturerId}`
        );
      }
    }
  }

  /**
   * Update lecturer signature
   * Handle both: base64 data (new signature) atau URL (existing signature, no change)
   */
  private async updateSignature(
    lecturerId: number,
    signatureData: string
  ): Promise<void> {
    if (!signatureData || signatureData.trim() === "") {
      return; // Skip jika kosong
    }

    try {
      // Check if signatureData is a URL (already exists in database)
      // URL format: /signatures/SIGNATURE_NIP_TIMESTAMP.png
      const isUrl = signatureData.startsWith("/signatures/");

      if (isUrl) {
        return;
      }

      // Check if it's base64 data URL format (new signature to upload)
      // Format: data:image/(png|jpg|jpeg);base64,...
      const isBase64 = signatureData.startsWith("data:image/");

      if (!isBase64) {
        throw new Error(
          "Invalid signature format. Expected URL (/signatures/...) or base64 (data:image/...)"
        );
      }

      // Update with new base64 signature
      await this.signatureService.updateSignature(lecturerId, signatureData);
    } catch (error) {
      console.error("Error updating signature:", error);
      throw new Error(
        `Gagal update signature: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get all expertises groups
   */
  async getAllExpertisesGroups(): Promise<any[]> {
    return await this.expertisesGroupRepository.findAll();
  }
}

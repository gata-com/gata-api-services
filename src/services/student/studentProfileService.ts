import { UserRepository } from "@/repositories/UserRepository";
import { StudentRepository } from "@/repositories/StudentRepository";
import bcryptjs from "bcryptjs";
import { config } from "@/config/config";

export class StudentProfileService {
  private userRepository: UserRepository;
  private studentRepository: StudentRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.studentRepository = new StudentRepository();
  }

  /**
   * Get student profile with supervisors and final project info
   */
  async getStudentProfile(userId: number): Promise<any> {
    // Use repository method to fetch with all relations
    const user =
      await this.userRepository.findStudentProfileWithProjectAndSupervisors(
        userId
      );

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    if (user.role !== "student") {
      throw new Error("USER_IS_NOT_STUDENT");
    }

    if (!user.student) {
      throw new Error("STUDENT_DATA_NOT_FOUND");
    }

    // Get student's final project with supervisors
    let pembimbing_1: string | null = null;
    let pembimbing_2: string | null = null;
    let judul_tugas_akhir: string | null = null;

    // Access final_project_members from student
    if (user.student.final_project_members) {
      const finalProjectMembers = user.student.final_project_members;
      const finalProject = finalProjectMembers.final_project;

      if (finalProject) {
        // Get title from final_project_members
        judul_tugas_akhir = finalProjectMembers.title || null;

        // Get supervisor 1 name
        if (finalProject.supervisor_1 && finalProject.supervisor_1.user) {
          pembimbing_1 = finalProject.supervisor_1.user.name || null;
        }

        // Get supervisor 2 name
        if (finalProject.supervisor_2 && finalProject.supervisor_2.user) {
          pembimbing_2 = finalProject.supervisor_2.user.name || null;
        }
      }
    }

    // Return student profile data
    const profileData = {
      id: user.id,
      name: user.name,
      nim: user.student.nim,
      email: user.email,
      whatsapp_number: user.whatsapp_number || null,
      pembimbing_1,
      pembimbing_2,
      judul_tugas_akhir,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    return profileData;
  }

  /**
   * Update student profile
   */
  async updateStudentProfile(
    userId: number,
    data: {
      name?: string;
      nim?: string;
      email?: string;
      whatsapp_number?: string;
      password?: string;
    }
  ): Promise<any> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    // Validation: whatsapp_number length if provided
    if (data.whatsapp_number && data.whatsapp_number.length < 10) {
      throw new Error("WHATSAPP_NUMBER_INVALID_LENGTH");
    }

    // Check email uniqueness if email is being changed
    if (data.email && data.email !== user?.email) {
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser) {
        throw new Error("EMAIL_ALREADY_EXISTS");
      }
    }

    // Check NIM uniqueness if NIM is being changed
    if (data.nim && data.nim !== user?.student?.nim) {
      const existingStudent = await this.studentRepository.findByNim(data.nim);
      if (existingStudent) {
        throw new Error("NIM_ALREADY_EXISTS");
      }
    }

    // Update user data
    const updateUserData: any = {};
    if (data.name !== undefined) updateUserData.name = data.name;
    if (data.email !== undefined) updateUserData.email = data.email;
    if (data.whatsapp_number !== undefined)
      updateUserData.whatsapp_number = data.whatsapp_number;

    // Hash password before update if provided
    if (data.password !== undefined && data.password.trim() !== "") {
      updateUserData.password = await bcryptjs.hash(
        data.password,
        config.bcryptSaltRounds
      );
    }

    // Update user in database
    if (Object.keys(updateUserData).length > 0) {
      await this.userRepository.update(userId, updateUserData);
    }

    // Update student NIM if provided
    if (data.nim !== undefined && user?.student?.id) {
      await this.studentRepository.update(user.student.id, { nim: data.nim });
    }

    // Return updated profile
    return this.getStudentProfile(userId);
  }
}

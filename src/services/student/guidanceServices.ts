import { StudentRepository } from "@/repositories/StudentRepository";
import { FinalProjectMemberRepository } from "@/repositories/FinalProjectMemberRepository";
import { FinalProjectRepository } from "@/repositories/FinalProjectRepository";
import { GuidanceAvailabilityRepository } from "@/repositories/GuidanceAvailabilityRepository";
import { GuidanceSessionsRepository } from "@/repositories/GuidanceSessionsRepository";
import { GuidanceDraftLinksRepository } from "@/repositories/GuidanceDraftLinksRepository";
import { DefenseSubmissionRepository } from "@/repositories/DefenseSubmissionRepository";
import { ExpertisesGroupRepository } from "@/repositories/ExpertisesGroupRepository";

import { ServicesReturn, ErrorValidation } from "@/types";
import {
  GuidanceDefenseRequest,
  GuidanceSessionCreateRequest,
} from "@/types/student";

export class GuidanceService {
  private studentRepo: StudentRepository;
  private FPMRepo: FinalProjectMemberRepository;
  private FPRepo: FinalProjectRepository;
  private GARepo: GuidanceAvailabilityRepository;
  private GSRepo: GuidanceSessionsRepository;
  private GDLRepo: GuidanceDraftLinksRepository;
  private DSRepo: DefenseSubmissionRepository;
  private EGRepo: ExpertisesGroupRepository;

  constructor() {
    this.studentRepo = new StudentRepository();
    this.FPMRepo = new FinalProjectMemberRepository();
    this.FPRepo = new FinalProjectRepository();
    this.GARepo = new GuidanceAvailabilityRepository();
    this.GSRepo = new GuidanceSessionsRepository();
    this.GDLRepo = new GuidanceDraftLinksRepository();
    this.DSRepo = new DefenseSubmissionRepository();
    this.EGRepo = new ExpertisesGroupRepository();
  }

  async getDashboard(
    userId: number
  ): Promise<ServicesReturn | { error: ErrorValidation }> {
    try {
      // 1. Cari student berdasarkan userId
      const student = await this.studentRepo.findByUserId(userId);
      if (!student) {
        return {
          error: {
            path: "server",
            msg: "Student not found",
          },
        };
      }

      // 2. Ambil semua guidance sessions untuk mahasiswa ini
      const guidanceSessions = await this.GSRepo.findByStudentIdWithLecturer(
        student.id
      );

      if (!guidanceSessions || guidanceSessions.length === 0) {
        return { error: null, data: [] };
      }

      // 3. Transform data ke format yang diinginkan
      const schedules = guidanceSessions.map((session: any) => {
        // Transform draft links
        const draftLinks = session.draft_links.map((link: any) => ({
          id: link.id,
          name: link.name,
          url: link.url,
        }));

        // Format session_date ke YYYY-MM-DD

        const sessionDateStr = new Date(session.session_date)
          .toISOString()
          .split("T")[0];

        // Format created_at ke ISO string
        const createdAtStr = new Date(session.created_at).toISOString();

        return {
          id: session.id,
          lecture_name: session.lecturer.user.name,
          lecture_nip: session.lecturer.nip,
          day_of_week: String(session.guidance_availability.day_of_week),
          session_date: sessionDateStr,
          start_time: session.guidance_availability.start_time,
          end_time: session.guidance_availability.end_time,
          topic: session.topic,
          location: session.guidance_availability.location,
          status: session.status,
          created_at: createdAtStr,
          draftLinks,
          lecturer_feedback: session.lecturer_feedback || undefined,
        };
      });

      return { error: null, data: schedules };
    } catch (error) {
      throw error;
    }
  }

  async getSupervisors(
    userId: number
  ): Promise<ServicesReturn | { error: ErrorValidation }> {
    try {
      // 1. Cari student berdasarkan userId dengan final project
      const student = await this.studentRepo.findByUserIdWithFinalProject(
        userId
      );

      if (!student || !student.final_project_members) {
        return {
          error: {
            path: "server",
            msg: "Student or final project not found",
          },
        };
      }

      // 2. Ambil final project dengan supervisor 1 dan 2 beserta user data
      const finalProjectWithSupervisors =
        await this.FPMRepo.findByIdWithSupervisors(
          student.final_project_members.id
        );

      if (
        !finalProjectWithSupervisors ||
        !finalProjectWithSupervisors.final_project
      ) {
        return {
          error: {
            path: "server",
            msg: "Final project not found",
          },
        };
      }

      const supervisors = [];
      const fp = finalProjectWithSupervisors.final_project;

      // Get tomorrow's day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDayOfWeek = tomorrow.getDay();

      // Helper function to filter availability by day of week
      const filterAvailabilityByTomorrow = (availabilities: any[]) => {
        return availabilities
          .filter((avail) => Number(avail.day_of_week) === tomorrowDayOfWeek)
          .map((avail) => ({
            id: avail.id,
            day_of_week: avail.day_of_week,
            start_time: avail.start_time,
            end_time: avail.end_time,
            location: avail.location,
          }));
      };

      // 3. Ambil supervisor 1 beserta availability
      if (fp.supervisor_1) {
        const supervisor1Availability = await this.GARepo.findByLecturerId(
          fp.supervisor_1.id
        );

        supervisors.push({
          id: fp.supervisor_1.id,
          fpId: fp.id,
          nama: fp.supervisor_1.user.name,
          nip: fp.supervisor_1.nip,
          lecturer_code: fp.supervisor_1.lecturer_code,
          supervisor_type: 1,
          availability: filterAvailabilityByTomorrow(supervisor1Availability),
        });
      }

      // 4. Ambil supervisor 2 jika ada
      if (fp.supervisor_2) {
        const supervisor2Availability = await this.GARepo.findByLecturerId(
          fp.supervisor_2.id
        );

        supervisors.push({
          id: fp.supervisor_2.id,
          fpId: fp.id,
          nama: fp.supervisor_2.user.name,
          nip: fp.supervisor_2.nip,
          lecturer_code: fp.supervisor_2.lecturer_code,
          supervisor_type: 2,
          availability: filterAvailabilityByTomorrow(supervisor2Availability),
        });
      }

      return { error: null, data: supervisors };
    } catch (error) {
      throw error;
    }
  }

  async getFPMembers(
    userId: number
  ): Promise<ServicesReturn | { error: ErrorValidation }> {
    try {
      // 1. Cari student berdasarkan userId dengan final project
      const student = await this.studentRepo.findByUserIdWithFinalProject(
        userId
      );
      if (!student || !student.final_project_members) {
        return {
          error: {
            path: "server",
            msg: "Student or final project not found",
          },
        };
      }

      // 2. Dapatkan final project ID dari student member
      const fpId = student.final_project_members.final_project.id;

      // 3. Ambil semua members dari final project berdasarkan fpId
      const members = await this.FPMRepo.findAllMembersByFinalProjectId(fpId);

      if (!members || members.length === 0) {
        return {
          error: {
            path: "server",
            msg: "No final project members found",
          },
        };
      }

      // 4. Transform data ke format yang diinginkan (array dengan email dan name)
      const result = members.map((member: any) => ({
        email: member.student.user.email,
        name: member.student.user.name,
      }));

      return { error: null, data: result };
    } catch (error) {
      throw error;
    }
  }

  async createSubmission(
    data: GuidanceSessionCreateRequest
  ): Promise<ServicesReturn | { error: ErrorValidation }> {
    const { GAId, draftLinks } = data;
    try {
      const existingSession = await this.GSRepo.findByGAId(GAId);
      if (existingSession) {
        return {
          error: {
            path: "server",
            msg: "Sudah ada sesi pada slot waktu yang dipilih",
          },
        };
      }

      // session date adalah hari ini + 1 hari
      const session_date = new Date();
      session_date.setDate(session_date.getDate() + 1);

      const createdGS = await this.GSRepo.createSubmission(data, session_date);

      for (const link of draftLinks) {
        const { id, name, url } = link;
        await this.GDLRepo.create({ name, url }, createdGS.raw.insertId);
      }

      return { error: null, data: null };
    } catch (error) {
      throw error;
    }
  }

  async createSubmissionDefense(
    data: GuidanceDefenseRequest
  ): Promise<ServicesReturn | { error: ErrorValidation }> {
    const {
      fpId,
      lecturerId,
      expertiseGroup1Id,
      expertiseGroup2Id,
      tipeSidang,
      defenseDocuments,
    } = data;
    try {
      // 1. Validasi final project exists
      const finalProject = await this.FPRepo.findById(fpId);
      if (!finalProject) {
        return {
          error: {
            path: "server",
            msg: "Final project not found",
          },
        };
      }

      // 2. Validasi sudah ada submission untuk defense type yang sama
      const existingSubmission = await this.DSRepo.findByFinalProjectAndType(
        fpId,
        tipeSidang
      );
      if (existingSubmission) {
        return {
          error: {
            path: "server",
            msg: `Sudah ada pengajuan ${tipeSidang} untuk tugas akhir ini`,
          },
        };
      }

      // 3. Validasi minimal bimbingan sebelum membuat submission
      const minGuidanceValidation = await this.validateMinimalGuidance(
        fpId,
        tipeSidang,
        finalProject
      );

      if (minGuidanceValidation.error) {
        return minGuidanceValidation;
      }

      // 4. Update expertises_group pada final_projects
      if (expertiseGroup1Id && expertiseGroup2Id) {
        await this.FPRepo.updateFinalProject(fpId, {
          expertises_group_1: { id: expertiseGroup1Id },
          expertises_group_2: { id: expertiseGroup2Id },
        } as any);
        console.log(
          `Updated final_project ${fpId} with expertise groups ${expertiseGroup1Id} and ${expertiseGroup2Id}`
        );
      }

      // 5. Create defense submission
      // (guidance counts akan dihitung automatic di repository)
      const newSubmission = await this.DSRepo.createSubmission(
        fpId,
        lecturerId,
        expertiseGroup1Id,
        expertiseGroup2Id,
        tipeSidang
      );

      // 6. Simpan documents ke defense_submission_documents dengan detail lengkap
      if (defenseDocuments && defenseDocuments.length > 0) {
        // Get the inserted ID dari newSubmission
        const submissionId =
          newSubmission.raw.insertId || newSubmission.identifiers[0]?.id;

        if (submissionId) {
          // Transform documents dengan type, email, dan studentId
          const documents = defenseDocuments.map((doc) => ({
            name: doc.name,
            url: doc.url,
            type: doc.type,
            email: doc.email,
            studentId: doc.studentId || undefined,
          }));

          // Save documents
          await this.DSRepo.createDocuments(submissionId, documents);
          console.log(
            `Saved ${documents.length} defense documents for submission ${submissionId}`
          );
        }
      }

      return { error: null, data: newSubmission };
    } catch (error) {
      throw error;
    }
  }

  async getExpertisesGroup(): Promise<
    ServicesReturn | { error: ErrorValidation }
  > {
    try {
      const result = await this.EGRepo.findAll();
      return { error: null, data: result };
    } catch (error) {
      throw error;
    }
  }
  /**
   * Validasi minimal bimbingan untuk submission defense
   * @param fpId - Final Project ID
   * @param tipeSidang - Jenis sidang (proposal atau hasil)
   * @param finalProject - Final project data
   * @returns { error: null } atau { error: ErrorValidation }
   */
  private async validateMinimalGuidance(
    fpId: number,
    tipeSidang: string,
    finalProject: any
  ): Promise<ServicesReturn | { error: ErrorValidation }> {
    // Jika sidang proposal
    if (tipeSidang === "proposal") {
      // 1. Hitung guidance completed untuk supervisor 1
      const guidanceCountSup1 = await this.DSRepo.getGuidanceCount(fpId, 1);
      const minGuidanceSup1 = 4; // Default minimal bimbingan proposal pembimbing 1

      if (guidanceCountSup1 < minGuidanceSup1) {
        return {
          error: {
            path: "server",
            msg: `Minimal bimbingan Pembimbing 1 belum terpenuhi. Diperlukan ${minGuidanceSup1} bimbingan, saat ini baru ${guidanceCountSup1} bimbingan.`,
          },
        };
      }

      // 2. Jika ada supervisor 2 (is_only_sup_1 = false atau null)
      if (!finalProject.is_only_sup_1 && finalProject.supervisor_2) {
        const guidanceCountSup2 = await this.DSRepo.getGuidanceCount(fpId, 2);
        const minGuidanceSup2 = 2; // Default minimal bimbingan proposal pembimbing 2

        if (guidanceCountSup2 < minGuidanceSup2) {
          return {
            error: {
              path: "server",
              msg: `Minimal bimbingan Pembimbing 2 belum terpenuhi. Diperlukan ${minGuidanceSup2} bimbingan, saat ini baru ${guidanceCountSup2} bimbingan.`,
            },
          };
        }
      }
    }

    // Jika sidang hasil
    if (tipeSidang === "hasil") {
      // 1. Hitung guidance completed untuk supervisor 1
      const guidanceCountSup1 = await this.DSRepo.getGuidanceCount(fpId, 1);
      const minGuidanceHasil = 2; // Default minimal bimbingan hasil pembimbing 1

      if (guidanceCountSup1 < minGuidanceHasil) {
        return {
          error: {
            path: "server",
            msg: `Minimal bimbingan untuk sidang hasil belum terpenuhi. Diperlukan ${minGuidanceHasil} bimbingan, saat ini baru ${guidanceCountSup1} bimbingan.`,
          },
        };
      }

      // 2. Jika ada supervisor 2 (is_only_sup_1 = false atau null)
      if (!finalProject.is_only_sup_1 && finalProject.supervisor_2) {
        const guidanceCountSup2 = await this.DSRepo.getGuidanceCount(fpId, 2);
        const minGuidanceHasil = 2; // Default minimal bimbingan hasil pembimbing 2

        if (guidanceCountSup2 < minGuidanceHasil) {
          return {
            error: {
              path: "server",
              msg: `Minimal bimbingan Pembimbing 2 untuk sidang hasil belum terpenuhi. Diperlukan ${minGuidanceHasil} bimbingan, saat ini baru ${guidanceCountSup2} bimbingan.`,
            },
          };
        }
      }
    }

    return { error: null, data: null };
  }
}

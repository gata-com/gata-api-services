import { GuidanceAvailabilityRepository } from "@/repositories/GuidanceAvailabilityRepository";
import { GuidanceSessionsRepository } from "@/repositories/GuidanceSessionsRepository";
import { LecturerRepository } from "@/repositories/LecturerRepository";
import { UserRepository } from "@/repositories/UserRepository";
import { DefenseSubmissionRepository } from "@/repositories/DefenseSubmissionRepository";

import { ErrorValidation } from "@/types";
import { ServicesReturn } from "@/types";
import {
  AvailabilityRequest,
  GuidanceActionRequest,
  TotalStudentsResponse,
} from "@/types/lecturer";
import { PengajuanSidang, StatusPengajuan } from "@/types/defense";
import AppDataSource from "@/config/database";

export class GuidanceService {
  private userRepo: UserRepository;
  private GARepo: GuidanceAvailabilityRepository;
  private GSRepo: GuidanceSessionsRepository;
  private LCRepo: LecturerRepository;
  private DSRepo: DefenseSubmissionRepository;

  constructor() {
    this.userRepo = new UserRepository();
    this.GARepo = new GuidanceAvailabilityRepository();
    this.GSRepo = new GuidanceSessionsRepository();
    this.LCRepo = new LecturerRepository();
    this.DSRepo = new DefenseSubmissionRepository();
  }

  /**
   * Get the start date of the current week (Monday)
   */
  private getWeekStartDate(date: Date = new Date()): Date {
    const d = new Date(date);
    const day = d.getDay();
    // Jika hari Minggu (0), ambil hari Minggu minggu ini
    // Jika hari Senin-Jumat (1-5), hitung mundur ke Senin
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  /**
   * Get the end date of the current week (Friday)
   */
  private getWeekEndDate(date: Date = new Date()): Date {
    const d = new Date(date);
    const day = d.getDay();
    // Jika hari Minggu (0), ambil hari Jumat minggu lalu
    // Jika hari Senin-Sabtu (1-6), hitung maju ke Jumat minggu ini
    const diff = d.getDate() - day + (day === 0 ? -2 : 5);
    return new Date(d.setDate(diff));
  }

  /**
   * Check if today is Saturday (6) or Sunday (0)
   */
  private isWeekendToday(): boolean {
    const today = new Date();
    const dayOfWeek = today.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday atau Saturday
  }

  /**
   * Get today's day of week (1=Monday, 2=Tuesday, ..., 5=Friday)
   */
  private getTodayDayOfWeek(): number {
    const today = new Date();
    const dayOfWeek = today.getDay();
    // Convert JavaScript day (0=Sunday) to database format (1=Monday)
    // JavaScript: 0=Sunday, 1=Monday, ..., 6=Saturday
    // Database: 1=Monday, 2=Tuesday, ..., 5=Friday
    if (dayOfWeek === 0) return 0; // Sunday - not in active days
    return dayOfWeek; // 1-6 (Monday-Saturday in JS)
  }

  /**
   * Format date to YYYY-MM-DD string
   */
  private formatDateToString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  /**
   * Auto-cancel scheduled sessions on weekend
   */
  private async autoCancelWeekendSessions(lecturerId: number): Promise<void> {
    try {
      if (!this.isWeekendToday()) {
        return; // Hanya auto-cancel jika hari Sabtu atau Minggu
      }

      const weekStartDate = this.getWeekStartDate();
      const weekEndDate = this.getWeekEndDate();

      // Use query builder for better date handling with MySQL
      await AppDataSource.createQueryBuilder()
        .update("guidance_sessions")
        .set({
          status: "cancelled",
          cancelled_at: new Date(),
        })
        .where("lecturerId = :lecturerId", { lecturerId })
        .andWhere("status = :status", { status: "scheduled" })
        .andWhere("DATE(session_date) >= DATE(:weekStart)", {
          weekStart: weekStartDate,
        })
        .andWhere("DATE(session_date) <= DATE(:weekEnd)", {
          weekEnd: weekEndDate,
        })
        .execute();
    } catch (error) {
      console.error("Error auto-canceling weekend sessions:", error);
      // Don't throw - this should not block the dashboard
    }
  }

  async getDashboard(
    userId: number
  ): Promise<ServicesReturn | { error: ErrorValidation }> {
    try {
      // 1. Cari lecturer berdasarkan userId
      const lc = await this.LCRepo.findByUserId(userId);
      if (!lc) {
        return {
          error: {
            path: "server",
            msg: "Lecturer not found",
          },
        };
      }

      // 2. Auto-cancel scheduled sessions if weekend
      await this.autoCancelWeekendSessions(lc.id);

      // 3. Ambil semua guidance sessions untuk dosen ini
      const allGuidanceSessions = await this.GSRepo.findByLecturerId(lc.id);

      if (!allGuidanceSessions || allGuidanceSessions.length === 0) {
        return { error: null, data: [] };
      }

      // 4. Filter data untuk hanya minggu ini dengan status 'scheduled'
      const today = new Date();
      const weekStartDate = this.getWeekStartDate(today);
      const weekEndDate = this.getWeekEndDate(today);
      const todayDayOfWeek = this.getTodayDayOfWeek();

      // Format tanggal untuk perbandingan
      const weekStartStr = this.formatDateToString(weekStartDate);
      const weekEndStr = this.formatDateToString(weekEndDate);
      const todayStr = this.formatDateToString(today);

      const filteredSessions = allGuidanceSessions.filter((session: any) => {
        // Convert session_date to string for comparison
        const sessionDateStr = this.formatDateToString(
          new Date(session.session_date)
        );

        // Filter 1: Session harus dalam minggu ini
        const isInThisWeek =
          sessionDateStr >= weekStartStr && sessionDateStr <= weekEndStr;

        // Filter 2: Session harus dengan status 'scheduled'
        const isScheduled = session.status === "scheduled";

        // Filter 3: Session date harus >= hari ini (tidak boleh tanggal lampau)
        const isNotPast = sessionDateStr >= todayStr;

        return isInThisWeek && isScheduled && isNotPast;
      });

      // 5. Transform data ke format yang diinginkan
      const schedules = filteredSessions.map((session: any) => {
        // Ambil mahasiswa dari final_project members
        const mahasiswa = session.final_project.members.map((member: any) => ({
          id: member.student.id,
          name: member.student.user.name,
          nim: member.student.nim,
        }));

        // Transform draft links
        const draftLinks = session.draft_links.map((link: any) => ({
          id: link.id,
          name: link.name,
          url: link.url,
          uploaded_at: link.uploaded_at.toISOString(),
        }));

        return {
          id: session.id,
          day_of_week: String(session.guidance_availability.day_of_week),
          session_date: session.session_date,
          start_time: session.guidance_availability.start_time,
          end_time: session.guidance_availability.end_time,
          tipeTA: session.final_project.type,
          status: session.status,
          lecturer_feedback: session.lecturer_feedback,
          location: session.guidance_availability.location,
          topic: session.topic,
          mahasiswa,
          student_notes: session.student_notes,
          draftLinks,
        };
      });

      return { error: null, data: schedules };
    } catch (error) {
      throw error;
    }
  }

  async dashboardActions(
    data: GuidanceActionRequest
  ): Promise<ServicesReturn | { error: ErrorValidation }> {
    try {
      const result = await this.GSRepo.updateStatus(data);
      return { error: null, data: result };
    } catch (error) {
      throw error;
    }
  }

  async getTotalStudents(
    userId: number
  ): Promise<ServicesReturn | { error: ErrorValidation }> {
    try {
      // 1. Cari lecturer berdasarkan userId
      const lc = await this.LCRepo.findByUserId(userId);
      if (!lc) {
        return {
          error: {
            path: "server",
            msg: "Lecturer not found",
          },
        };
      }

      // 2. Ambil semua guidance sessions untuk dosen ini
      const allGuidanceSessions = await this.GSRepo.findByLecturerId(lc.id);

      if (!allGuidanceSessions || allGuidanceSessions.length === 0) {
        return { error: null, data: [] };
      }

      // 3. Transform data ke format TotalStudentsResponse
      const result: TotalStudentsResponse[] = allGuidanceSessions.map(
        (session: any) => {

          console.log("Processing session:", session.final_project.members);
          // Ambil mahasiswa dari final_project members
          const mahasiswa = session.final_project.members.map(
            (member: any) => ({
              id: member.student.id,
              name: member.student.user.name,
              nim: member.student.nim,
            })
          );

          // Transform draft links
          const draftLinks = session.draft_links
            ? session.draft_links.map((link: any) => ({
                id: link.id,
                name: link.name,
                url: link.url,
                uploaded_at: link.uploaded_at.toISOString(),
              }))
            : [];

          return {
            id: session.id,
            day_of_week: String(session.guidance_availability.day_of_week) as
              | "1"
              | "2"
              | "3"
              | "4"
              | "5",
            session_date: this.formatDateToString(
              new Date(session.session_date)
            ),
            start_time: session.guidance_availability.start_time,
            end_time: session.guidance_availability.end_time,
            tipeTA: session.final_project.type,
            location: session.guidance_availability.location,
            topic: session.topic,
            defense_type: session.defense_type,
            lecturer_feedback: session.lecturer_feedback || undefined,
            status: session.status,
            mahasiswa,
            draftLinks: draftLinks.length > 0 ? draftLinks : undefined,
          };
        }
      );

      return { error: null, data: result };
    } catch (error) {
      throw error;
    }
  }

  async getAvailability(
    userId: number
  ): Promise<ServicesReturn | { error: ErrorValidation }> {
    try {
      const lc = await this.LCRepo.findByUserId(userId);
      if (!lc) {
        return {
          error: {
            path: "server",
            msg: "Lecturer not found",
          },
        };
      }

      const result = await this.GARepo.getAvailability(lc.id);
      return { error: null, data: result };
    } catch (error) {
      throw error;
    }
  }

  async saveAvailability(
    data: AvailabilityRequest
  ): Promise<ServicesReturn | { error: ErrorValidation }> {
    const { user_id } = data;
    try {
      const lc = await this.LCRepo.findByUserId(user_id);

      if (!lc) {
        return {
          error: {
            path: "server",
            msg: "Lecturer not found",
          },
        };
      }

      const result = await this.GARepo.saveAvailability(data, lc.id);
      return { error: null, data: result };
    } catch (error) {
      throw error;
    }
  }

  async deleteAvailability(
    id: string
  ): Promise<ServicesReturn | { error: ErrorValidation }> {
    try {
      const result = await this.GARepo.deleteById(parseInt(id));
      return { error: null, data: result };
    } catch (error) {
      throw error;
    }
  }

  async getDefenseSubmission(
    userId: number
  ): Promise<ServicesReturn | { error: ErrorValidation }> {
    try {
      // 1. Cari lecturer berdasarkan userId
      const lc = await this.LCRepo.findByUserId(userId);
      if (!lc) {
        return {
          error: {
            path: "server",
            msg: "Lecturer not found",
          },
        };
      }

      // 2. Ambil semua defense submissions untuk dosen ini
      const defenseSubmissions = await this.DSRepo.findByLecturerId(lc.id);

      if (!defenseSubmissions || defenseSubmissions.length === 0) {
        return { error: null, data: [] };
      }

      // 3. Transform data menjadi format PengajuanSidang
      const pengajuanSidangList: PengajuanSidang[] = defenseSubmissions.map(
        (submission: any) => {
          // Transform mahasiswa dari members
          const mahasiswa = submission.final_project.members.map(
            (member: any) => ({
              id: member.student.id,
              nama: member.student.user.name,
              nim: member.student.nim,
              email: member.student.user.email,
            })
          );

          // Transform dokumen pendukung
          const dokumenPendukung = submission.documents.map((doc: any) => ({
            id: doc.id,
            nama: doc.name,
            url: doc.url,
            uploadedAt: new Date(doc.uploaded_at).toISOString(),
          }));

          // Map status database ke status yang sesuai
          const statusMapping: {
            [key: string]: StatusPengajuan;
          } = {
            pending: "menunggu",
            approved: "disetujui",
            rejected: "ditolak",
          };

          // Hitung minimal bimbingan berdasarkan jenis sidang
          let minimalBimbingan = 0;
          if (submission.defense_type === "proposal") {
            minimalBimbingan = submission.min_guidance_sup_1_proposal || 4;
          } else if (submission.defense_type === "hasil") {
            minimalBimbingan = submission.min_guidance_hasil || 2;
          }

          // Hitung jumlah bimbingan (ambil yang terbanyak antara sup1 dan sup2)
          const jumlahBimbingan = Math.max(
            submission.guidance_sup_1_count || 0,
            submission.guidance_sup_2_count || 0
          );

          // Ambil dosen pembimbing
          const dosenPembimbing = [];
          if (submission.final_project.supervisor_1) {
            dosenPembimbing.push({
              id: submission.final_project.supervisor_1.id,
              nama: submission.final_project.supervisor_1.user.name,
            });
          }
          if (submission.final_project.supervisor_2) {
            dosenPembimbing.push({
              id: submission.final_project.supervisor_2.id,
              nama: submission.final_project.supervisor_2.user.name,
            });
          }

          // Ambil judul dari member pertama (title)
          const judulTA = submission.final_project.members[0]?.title || "-";

          // Ambil kelompok keahlian dari defense submission (bukan final project)
          const kk1 = submission.expertises_group_1?.name;
          const kk2 = submission.expertises_group_2?.name;

          return {
            id: submission.id,
            mahasiswa: mahasiswa.length === 1 ? mahasiswa[0] : mahasiswa,
            tipeTA: submission.final_project.type as "regular" | "capstone",
            jenisSidang: submission.defense_type as "proposal" | "hasil",
            judulTA,
            jumlahBimbingan,
            minimalBimbingan,
            status: statusMapping[submission.status] || "menunggu",
            tanggalPengajuan: new Date(submission.created_at).toISOString(),
            tanggalDiproses: submission.processed_at
              ? new Date(submission.processed_at).toISOString()
              : undefined,
            dokumenPendukung,
            catatan: submission.student_notes || undefined,
            catatanPenolakan: submission.rejection_notes || undefined,
            kelompokKeahlian: kk1 || kk2 ? { kk1, kk2 } : undefined,
            dosenPembimbing:
              dosenPembimbing.length > 0 ? dosenPembimbing : undefined,
          };
        }
      );

      return { error: null, data: pengajuanSidangList };
    } catch (error) {
      throw error;
    }
  }

  async approvalDefenseSubmission(data: {
    id: number;
    status: "approved" | "rejected";
  }): Promise<ServicesReturn | { error: ErrorValidation }> {
    try {
      const result = await this.DSRepo.approvalSubmission(data);
      return { error: null, data: result };
    } catch (error) {
      throw error;
    }
  }
}

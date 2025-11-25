import { Repository, LessThanOrEqual, MoreThan } from "typeorm";
import AppDataSource from "@/config/database";
import { FinalProjects } from "@/entities/finalProject";
import { FinalProjectMembers } from "@/entities/finalProject";
import { GuidanceSession } from "@/entities/guidance";
import { DefenseSchedule } from "@/entities/defenseSchedule";
import { Student } from "@/entities/student";
import Announcements from "@/entities/announcement";

export class StudentDashboardRepository {
  private finalProjectMembersRepository: Repository<FinalProjectMembers>;
  private finalProjectRepository: Repository<FinalProjects>;
  private guidanceRepository: Repository<GuidanceSession>;
  private defenseScheduleRepository: Repository<DefenseSchedule>;
  private studentRepository: Repository<Student>;
  private announcementRepository: Repository<Announcements>;

  constructor() {
    this.finalProjectMembersRepository =
      AppDataSource.getRepository(FinalProjectMembers);
    this.finalProjectRepository = AppDataSource.getRepository(FinalProjects);
    this.guidanceRepository = AppDataSource.getRepository(GuidanceSession);
    this.defenseScheduleRepository =
      AppDataSource.getRepository(DefenseSchedule);
    this.studentRepository = AppDataSource.getRepository(Student);
    this.announcementRepository = AppDataSource.getRepository(Announcements);
  }

  /**
   * Get student profile data
   */
  async getStudentProfile(studentId: number) {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      relations: ["user"],
    });

    if (!student || !student.user) {
      return null;
    }

    return {
      id: student.id,
      name: student.user.name,
      npm: student.nim,
      email: student.user.email,
      phone: student.user.whatsapp_number,
      avatar: null,
      program_study: "Teknik Informatika", // TODO: Add program_study ke Student entity
    };
  }

  /**
   * Get guidance progress untuk semua supervisor
   */
  async getGuidanceProgress(studentId: number) {
    // Get student's final project member
    const fpm = await this.finalProjectMembersRepository.findOne({
      where: { student: { id: studentId } },
      relations: [
        "final_project",
        "final_project.supervisor_1",
        "final_project.supervisor_1.user",
        "final_project.supervisor_2",
        "final_project.supervisor_2.user",
        "final_project.guidance_sessions",
      ],
    });

    if (!fpm || !fpm.final_project) {
      return [];
    }

    const fp = fpm.final_project;

    // Filter guidance sessions by supervisor type and status
    const sup1Sessions = (fp.guidance_sessions || []).filter(
      (gs: GuidanceSession) =>
        gs.supervisor_type === 1 && gs.status === "completed"
    );
    const sup2Sessions = (fp.guidance_sessions || []).filter(
      (gs: GuidanceSession) =>
        gs.supervisor_type === 2 && gs.status === "completed"
    );

    const result: any[] = [];

    // Supervisor 1
    if (fp.supervisor_1) {
      const lastSession = sup1Sessions.sort(
        (a: GuidanceSession, b: GuidanceSession) =>
          new Date(b.session_date).getTime() -
          new Date(a.session_date).getTime()
      )[0];

      result.push({
        supervisor_id: fp.supervisor_1.id,
        supervisor: {
          id: fp.supervisor_1.id,
          name: fp.supervisor_1.user?.name || "Unknown",
          title: "Dr.",
          email: fp.supervisor_1.user?.email,
          phone: fp.supervisor_1.user?.whatsapp_number,
        },
        total_sessions: 8,
        completed_sessions: sup1Sessions.length,
        progress_percentage: (sup1Sessions.length / 8) * 100,
        last_session_date: lastSession
          ? new Date(lastSession.session_date).toISOString()
          : null,
        status: sup1Sessions.length > 0 ? "active" : "waiting",
      });
    }

    // Supervisor 2
    if (fp.supervisor_2) {
      const lastSession = sup2Sessions.sort(
        (a: GuidanceSession, b: GuidanceSession) =>
          new Date(b.session_date).getTime() -
          new Date(a.session_date).getTime()
      )[0];

      result.push({
        supervisor_id: fp.supervisor_2.id,
        supervisor: {
          id: fp.supervisor_2.id,
          name: fp.supervisor_2.user?.name || "Unknown",
          title: "Dr.",
          email: fp.supervisor_2.user?.email,
          phone: fp.supervisor_2.user?.whatsapp_number,
        },
        total_sessions: 8,
        completed_sessions: sup2Sessions.length,
        progress_percentage: (sup2Sessions.length / 8) * 100,
        last_session_date: lastSession
          ? new Date(lastSession.session_date).toISOString()
          : null,
        status: sup2Sessions.length > 0 ? "active" : "waiting",
      });
    }

    return result;
  }

  /**
   * Get timeline/milestones
   */
  async getTimeline(studentId: number) {
    // Fixed timeline based on typical semester flow
    const timeline = [
      {
        id: 1,
        milestone: "Judul Disetujui",
        description: "Judul tugas akhir telah disetujui oleh koordinator",
        status: "completed",
        due_date: new Date("2025-09-15T23:59:59Z").toISOString(),
        completed_date: new Date("2025-09-15T10:30:00Z").toISOString(),
        notes: "Disetujui oleh Koordinator Tugas Akhir",
      },
      {
        id: 2,
        milestone: "Bimbingan Progress",
        description: "Proses bimbingan dengan dosen pembimbing berlangsung",
        status: "in_progress",
        due_date: new Date("2025-12-31T23:59:59Z").toISOString(),
        completed_date: null,
        notes: "Target selesai: Desember 2025",
      },
      {
        id: 3,
        milestone: "Sidang Proposal",
        description: "Presentasi proposal tugas akhir di depan tim penguji",
        status: "not_started",
        due_date: new Date("2026-01-30T23:59:59Z").toISOString(),
        completed_date: null,
        notes: "Estimasi: Januari 2026",
      },
      {
        id: 4,
        milestone: "Sidang Akhir",
        description:
          "Presentasi hasil akhir tugas akhir dan ujian komprehensif",
        status: "not_started",
        due_date: new Date("2026-05-30T23:59:59Z").toISOString(),
        completed_date: null,
        notes: "Estimasi: Mei 2026",
      },
    ];

    return timeline;
  }

  /**
   * Get upcoming activities/schedules
   */
  async getUpcomingActivities(studentId: number, days: number = 7) {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      relations: [
        "final_project_members",
        "final_project_members.final_project",
      ],
    });

    if (!student || !student.final_project_members) {
      return [];
    }

    const finalProjectId = student.final_project_members.final_project?.id;
    if (!finalProjectId) {
      return [];
    }

    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    // Get guidance sessions
    const guidanceSessions = await this.guidanceRepository.find({
      where: {
        final_project: { id: finalProjectId },
        session_date: MoreThan(now),
      },
      relations: ["lecturer", "lecturer.user"],
      order: { session_date: "ASC" },
      take: days,
    });

    // Get defense schedules
    const defenseSchedules = await this.defenseScheduleRepository.find({
      where: {
        status: "scheduled",
      },
      relations: ["defense_submission", "defense_submission.final_project"],
      order: { scheduled_date: "ASC" },
    });

    const activities: any[] = [];

    // Add guidance sessions
    guidanceSessions.forEach((session, idx) => {
      const daysDiff = Math.floor(
        (new Date(session.session_date).getTime() - now.getTime()) /
          (24 * 60 * 60 * 1000)
      );

      activities.push({
        id: 1000 + idx,
        title: `Bimbingan Dosbim ${session.supervisor_type}`,
        description: `Sesi bimbingan dengan ${session.lecturer?.user?.name}`,
        activity_type: "guidance",
        scheduled_date: new Date(session.session_date).toISOString(),
        scheduled_time: "10:00",
        location: "Ruang Dosen - Gedung D",
        supervisor_id: session.lecturer?.id,
        supervisor: session.lecturer
          ? {
              id: session.lecturer.id,
              name: session.lecturer.user?.name || "Unknown",
              title: "Dr.",
              email: session.lecturer.user?.email,
              phone: session.lecturer.user?.whatsapp_number,
            }
          : null,
        urgency: daysDiff <= 1 ? "high" : daysDiff <= 3 ? "medium" : "normal",
        status:
          daysDiff === 0 ? "today" : daysDiff < 0 ? "overdue" : "upcoming",
        days_until: daysDiff,
      });
    });

    // Add defense schedules
    defenseSchedules.forEach((schedule, idx) => {
      if (schedule.defense_submission?.final_project?.id !== finalProjectId) {
        return;
      }

      const daysDiff = Math.floor(
        (new Date(schedule.scheduled_date).getTime() - now.getTime()) /
          (24 * 60 * 60 * 1000)
      );

      activities.push({
        id: 2000 + idx,
        title: `Sidang ${
          schedule.defense_submission.defense_type === "proposal"
            ? "Proposal"
            : "Akhir"
        }`,
        description: `Presentasi ${
          schedule.defense_submission.defense_type === "proposal"
            ? "proposal"
            : "hasil akhir"
        } tugas akhir`,
        activity_type: "exam",
        scheduled_date: new Date(
          `${schedule.scheduled_date}T${schedule.start_time}`
        ).toISOString(),
        scheduled_time: schedule.start_time,
        location: schedule.room || "Ruang Dosen",
        supervisor_id: null,
        supervisor: null,
        urgency: daysDiff <= 1 ? "high" : daysDiff <= 3 ? "medium" : "normal",
        status:
          daysDiff === 0 ? "today" : daysDiff < 0 ? "overdue" : "upcoming",
        days_until: daysDiff,
      });
    });

    // Sort by scheduled_date and return top ones
    return activities
      .sort(
        (a, b) =>
          new Date(a.scheduled_date).getTime() -
          new Date(b.scheduled_date).getTime()
      )
      .slice(0, days);
  }

  /**
   * Get announcements (published only)
   */
  async getAnnouncements(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [announcements, total] =
      await this.announcementRepository.findAndCount({
        where: { is_published: true },
        order: { created_at: "DESC" },
        skip,
        take: limit,
      });

    return {
      data: announcements.map((a) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        priority: a.priority,
        is_published: a.is_published,
        created_at: a.created_at.toISOString(),
        updated_at: a.updated_at.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get recent announcements only
   */
  async getRecentAnnouncements(limit: number = 5) {
    const announcements = await this.announcementRepository.find({
      where: { is_published: true },
      order: { priority: "DESC" },
      take: limit,
    });

    return announcements.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      priority: a.priority,
      is_published: a.is_published,
      created_at: a.created_at.toISOString(),
      updated_at: a.updated_at.toISOString(),
    }));
  }

  /**
   * Get dashboard stats
   */
  async getDashboardStats(studentId: number) {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      relations: [
        "final_project_members",
        "final_project_members.final_project",
      ],
    });

    if (!student || !student.final_project_members) {
      return {
        total_guidance_sessions: 0,
        completed_guidance_sessions: 0,
        pending_revisions: 0,
        upcoming_activities_count: 0,
        completion_percentage: 0,
      };
    }

    const finalProjectId = student.final_project_members.final_project?.id;
    if (!finalProjectId) {
      return {
        total_guidance_sessions: 0,
        completed_guidance_sessions: 0,
        pending_revisions: 0,
        upcoming_activities_count: 0,
        completion_percentage: 0,
      };
    }

    // Get all guidance sessions
    const allSessions = await this.guidanceRepository.find({
      where: {
        final_project: { id: finalProjectId },
      },
    });

    const completedSessions = allSessions.filter(
      (s) => s.status === "completed"
    ).length;

    // Get upcoming activities count
    const now = new Date();
    const upcomingActivities = await this.guidanceRepository.find({
      where: {
        final_project: { id: finalProjectId },
        session_date: MoreThan(now),
      },
    });

    return {
      total_guidance_sessions: allSessions.length,
      completed_guidance_sessions: completedSessions,
      pending_revisions: 0, // TODO: Implement pending revisions logic
      upcoming_activities_count: upcomingActivities.length,
      completion_percentage:
        allSessions.length > 0
          ? Math.round((completedSessions / allSessions.length) * 100)
          : 0,
    };
  }
}

import { LecturerDashboardRepository } from "@/repositories/LecturerDashboardRepository";
import { AnnouncementRepository } from "@/repositories/AnnouncementRepository";
import { UserRepository } from "@/repositories/UserRepository";

export class LecturerDashboardService {
  private dashboardRepository: LecturerDashboardRepository;
  private announcementsRepository: AnnouncementRepository;
  private userRepository: UserRepository;

  constructor() {
    this.dashboardRepository = new LecturerDashboardRepository();
    this.announcementsRepository = new AnnouncementRepository();
    this.userRepository = new UserRepository();
  }

  /**
   * Get complete dashboard data
   */
  async getDashboardData(userId: number): Promise<any> {
    // Get user dan lecturer info
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const lecturerId = user.lecturer.id;

    // Get all dashboard components
    const [stats, upcomingSchedules, guidedStudents, summary] =
      await Promise.all([
        this.dashboardRepository.getDashboardStats(lecturerId),
        this.dashboardRepository.getUpcomingSchedules(lecturerId, 10),
        this.dashboardRepository.getGuidedStudents(
          lecturerId,
          undefined,
          undefined,
          50
        ),
        this.dashboardRepository.getGuidedStudentsSummary(lecturerId),
      ]);

    // Get announcements (hardcoded for now - bisa di-fetch dari database nanti)
    const announcements = await this.announcementsRepository.findPublished();

    return {
      stats,
      upcomingSchedules,
      guidedStudents,
      guidedStudentsSummary: summary,
      announcements,
    };
  }

  /**
   * Get dashboard stats
   */
  async getDashboardStats(userId: number): Promise<any> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    if (!user.lecturer) {
      throw new Error("USER_IS_NOT_LECTURER");
    }

    const stats = await this.dashboardRepository.getDashboardStats(
      user.lecturer.id
    );
    return stats;
  }

  /**
   * Get upcoming schedules
   */
  async getUpcomingSchedules(
    userId: number,
    limit: number = 10,
    status?: string,
    jenis?: string
  ): Promise<any[]> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    if (!user.lecturer) {
      throw new Error("USER_IS_NOT_LECTURER");
    }

    return this.dashboardRepository.getUpcomingSchedules(
      user.lecturer.id,
      Math.min(limit, 50), // Max limit 50
      status,
      jenis
    );
  }

  /**
   * Get guided students
   */
  async getGuidedStudents(
    userId: number,
    status?: string,
    jenis?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    if (!user.lecturer) {
      throw new Error("USER_IS_NOT_LECTURER");
    }

    return this.dashboardRepository.getGuidedStudents(
      user.lecturer.id,
      status,
      jenis,
      Math.min(limit, 50), // Max limit 50
      offset
    );
  }

  /**
   * Get guided students summary
   */
  async getGuidedStudentsSummary(userId: number): Promise<any[]> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    if (!user.lecturer) {
      throw new Error("USER_IS_NOT_LECTURER");
    }

    return this.dashboardRepository.getGuidedStudentsSummary(user.lecturer.id);
  }
}

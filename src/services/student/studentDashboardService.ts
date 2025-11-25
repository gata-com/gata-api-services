import { StudentDashboardRepository } from "@/repositories/StudentDashboardRepository";
import { StudentRepository } from "@/repositories/StudentRepository";
import { UserRepository } from "@/repositories/UserRepository";

export class StudentDashboardService {
  private studentDashboardRepository: StudentDashboardRepository;
  private studentRepository: StudentRepository;
  private userRepository: UserRepository;

  constructor() {
    this.studentDashboardRepository = new StudentDashboardRepository();
    this.studentRepository = new StudentRepository();
    this.userRepository = new UserRepository();
  }

  /**
   * Get complete dashboard data
   */
  async getDashboardData(userId: number) {
    // Validate user exists and is a student
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    // Get student data
    const student = await this.studentRepository.repository.findOne({
      where: { user: { id: userId } },
    });
    if (!student) {
      throw new Error("USER_IS_NOT_STUDENT");
    }

    // Fetch all dashboard components
    const [
      profile,
      guidanceProgress,
      timeline,
      upcomingActivities,
      announcements,
      stats,
    ] = await Promise.all([
      this.studentDashboardRepository.getStudentProfile(student.id),
      this.studentDashboardRepository.getGuidanceProgress(student.id),
      this.studentDashboardRepository.getTimeline(student.id),
      this.studentDashboardRepository.getUpcomingActivities(student.id),
      this.studentDashboardRepository.getRecentAnnouncements(3),
      this.studentDashboardRepository.getDashboardStats(student.id),
    ]);

    return {
      profile,
      stats,
      guidance_progress: guidanceProgress,
      timeline,
      upcoming_activities: upcomingActivities,
      announcements,
    };
  }

  /**
   * Get student profile only
   */
  async getProfile(userId: number) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const student = await this.studentRepository.repository.findOne({
      where: { user: { id: userId } },
    });
    if (!student) {
      throw new Error("USER_IS_NOT_STUDENT");
    }

    return this.studentDashboardRepository.getStudentProfile(student.id);
  }

  /**
   * Get guidance progress
   */
  async getGuidanceProgress(userId: number) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const student = await this.studentRepository.repository.findOne({
      where: { user: { id: userId } },
    });
    if (!student) {
      throw new Error("USER_IS_NOT_STUDENT");
    }

    return this.studentDashboardRepository.getGuidanceProgress(student.id);
  }

  /**
   * Get timeline
   */
  async getTimeline(userId: number) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const student = await this.studentRepository.repository.findOne({
      where: { user: { id: userId } },
    });
    if (!student) {
      throw new Error("USER_IS_NOT_STUDENT");
    }

    return this.studentDashboardRepository.getTimeline(student.id);
  }

  /**
   * Get upcoming activities
   */
  async getUpcomingActivities(userId: number, days: number = 7) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const student = await this.studentRepository.repository.findOne({
      where: { user: { id: userId } },
    });
    if (!student) {
      throw new Error("USER_IS_NOT_STUDENT");
    }

    return this.studentDashboardRepository.getUpcomingActivities(
      student.id,
      days
    );
  }

  /**
   * Get announcements with pagination
   */
  async getAnnouncements(
    userId: number,
    page: number = 1,
    limit: number = 10,
    recent: boolean = false
  ) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const student = await this.studentRepository.repository.findOne({
      where: { user: { id: userId } },
    });
    if (!student) {
      throw new Error("USER_IS_NOT_STUDENT");
    }

    if (recent) {
      return {
        data: await this.studentDashboardRepository.getRecentAnnouncements(
          limit
        ),
      };
    }

    return this.studentDashboardRepository.getAnnouncements(page, limit);
  }

  /**
   * Get dashboard stats
   */
  async getDashboardStats(userId: number) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const student = await this.studentRepository.repository.findOne({
      where: { user: { id: userId } },
    });
    if (!student) {
      throw new Error("USER_IS_NOT_STUDENT");
    }

    return this.studentDashboardRepository.getDashboardStats(student.id);
  }
}

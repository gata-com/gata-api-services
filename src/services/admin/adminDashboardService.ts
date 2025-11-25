import { AdminDashboardRepository } from "@/repositories/AdminDashboardRepository";

export class AdminDashboardService {
  private dashboardRepository: AdminDashboardRepository;

  constructor() {
    this.dashboardRepository = new AdminDashboardRepository();
  }

  /**
   * Get complete dashboard statistics
   */
  async getDashboardStats(
    semester?: string,
    tahunAkademik?: string
  ): Promise<any> {
    return await this.dashboardRepository.getDashboardStats(
      semester,
      tahunAkademik
    );
  }

  /**
   * Get system status overview
   */
  async getSystemStatus(): Promise<any> {
    return await this.dashboardRepository.getSystemStatus();
  }

  /**
   * Get quick stats by category
   */
  async getQuickStats(category: string): Promise<any> {
    const validCategories = [
      "mahasiswa_baru",
      "dosen_aktif",
      "sidang_selesai",
      "sidang_terjadwal",
    ];

    if (!validCategories.includes(category)) {
      throw new Error("INVALID_CATEGORY");
    }

    return await this.dashboardRepository.getQuickStats(category);
  }

  /**
   * Get periode information
   */
  async getPeriodeInfo(): Promise<any> {
    return await this.dashboardRepository.getPeriodeInfo();
  }

  /**
   * Get dosen verification status
   */
  async getDosenVerificationStatus(): Promise<any> {
    return await this.dashboardRepository.getDosenVerificationStatus();
  }

  /**
   * Get jadwal sidang status
   */
  async getJadwalSidangStatus(
    minggudepan?: boolean,
    bulan?: number
  ): Promise<any> {
    return await this.dashboardRepository.getJadwalSidangStatus(
      minggudepan,
      bulan
    );
  }

  /**
   * Get recent announcements
   */
  async getRecentAnnouncements(limit: number = 2): Promise<any[]> {
    return await this.dashboardRepository.getRecentAnnouncements(limit);
  }
}

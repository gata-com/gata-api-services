import { Repository, QueryRunner } from "typeorm";
import AppDataSource from "../config/database";
import { FinalProjects } from "../entities/finalProject";
import { Student } from "../entities/student";
import { Lecturer } from "../entities/lecturer";
import { DefenseSchedule } from "../entities/defenseSchedule";
import Announcements from "../entities/announcement";
import { GuidanceSession } from "../entities/guidance";
import User from "../entities/user";

export class AdminDashboardRepository {
  private finalProjectRepository: Repository<FinalProjects>;
  private studentRepository: Repository<Student>;
  private lecturerRepository: Repository<Lecturer>;
  private defenseScheduleRepository: Repository<DefenseSchedule>;
  private announcementRepository: Repository<Announcements>;
  private guidanceSessionRepository: Repository<GuidanceSession>;
  private userRepository: Repository<User>;

  constructor(private queryRunner?: QueryRunner) {
    if (queryRunner) {
      this.finalProjectRepository =
        queryRunner.manager.getRepository(FinalProjects);
      this.studentRepository = queryRunner.manager.getRepository(Student);
      this.lecturerRepository = queryRunner.manager.getRepository(Lecturer);
      this.defenseScheduleRepository =
        queryRunner.manager.getRepository(DefenseSchedule);
      this.announcementRepository =
        queryRunner.manager.getRepository(Announcements);
      this.guidanceSessionRepository =
        queryRunner.manager.getRepository(GuidanceSession);
      this.userRepository = queryRunner.manager.getRepository(User);
    } else {
      this.finalProjectRepository = AppDataSource.getRepository(FinalProjects);
      this.studentRepository = AppDataSource.getRepository(Student);
      this.lecturerRepository = AppDataSource.getRepository(Lecturer);
      this.defenseScheduleRepository =
        AppDataSource.getRepository(DefenseSchedule);
      this.announcementRepository = AppDataSource.getRepository(Announcements);
      this.guidanceSessionRepository =
        AppDataSource.getRepository(GuidanceSession);
      this.userRepository = AppDataSource.getRepository(User);
    }
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(
    semester?: string,
    tahunAkademik?: string
  ): Promise<any> {
    // Total mahasiswa
    const totalMahasiswa = await this.studentRepository
      .createQueryBuilder("s")
      .getCount();

    // Mahasiswa baru (minggu ini) - based on created_at
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const mahasiswaBaru = await this.studentRepository
      .createQueryBuilder("s")
      .where("s.created_at >= :date", { date: sevenDaysAgo })
      .getCount();

    // Mahasiswa terdaftar semester ini
    const mahasiswaTerdaftarSemesterIni =
      await this.getMahasiswaTerdaftarSemesterIni();

    // Mahasiswa status breakdown
    const mahasiswaStatusBreakdown = await this.getMahasiswaStatusBreakdown();

    // Persentase pertumbuhan mahasiswa
    const persentasePertumbuhan =
      await this.getPersentasePertumbuhanMahasiswa();

    // Total dosen
    const totalDosen = await this.lecturerRepository
      .createQueryBuilder("L")
      .getCount();

    // Dosen aktif (punya mahasiswa bimbingan)
    const dosenAktif = await this.lecturerRepository
      .createQueryBuilder("l")
      .where(
        "l.current_supervised_1 > :zero OR l.current_supervised_2 > :zero",
        { zero: 0 }
      )
      .getCount();

    // Dosen tersedia bimbingan (belum penuh)
    const dosenTersediaBimbingan = await this.getDosenTersediaBimbingan();

    // Dosen status breakdown
    const dosenStatusBreakdown = await this.getDosenStatusBreakdown();

    // Total jadwal sidang minggu ini
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    const jadwalSidangMingguIni = await this.defenseScheduleRepository
      .createQueryBuilder("ds")
      .where("ds.scheduled_date BETWEEN :start AND :end", {
        start: startOfWeek.toISOString().split("T")[0],
        end: endOfWeek.toISOString().split("T")[0],
      })
      .getCount();

    // Total jadwal sidang bulan ini
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const jadwalSidangBulanIni = await this.defenseScheduleRepository
      .createQueryBuilder("ds")
      .where("ds.scheduled_date BETWEEN :start AND :end", {
        start: startOfMonth.toISOString().split("T")[0],
        end: endOfMonth.toISOString().split("T")[0],
      })
      .getCount();

    // Sidang selesai minggu ini
    const sidangSelesaiMingguIni = await this.defenseScheduleRepository
      .createQueryBuilder("ds")
      .where("ds.scheduled_date BETWEEN :start AND :end", {
        start: startOfWeek.toISOString().split("T")[0],
        end: endOfWeek.toISOString().split("T")[0],
      })
      .andWhere("ds.status = :status", { status: "completed" })
      .getCount();

    // Jadwal sidang status breakdown
    const jadwalSidangStatusBreakdown =
      await this.getJadwalSidangStatusBreakdown();

    // Belum dijadwalkan
    const belumDijadwalkan = await this.getSidangBelumTerjadwal();

    // Total pengumuman (published)
    const totalPengumuman = await this.announcementRepository
      .createQueryBuilder("a")
      .where("a.is_published = :is_published", { is_published: true })
      .getCount();

    // Pengumuman pending
    const pengumumanPending = await this.announcementRepository
      .createQueryBuilder("a")
      .where("a.is_published = :is_published", { is_published: false })
      .getCount();

    // Pengumuman dipublikasikan
    const pengumumanDipublikasikan = await this.announcementRepository
      .createQueryBuilder("a")
      .where("a.is_published = :is_published", { is_published: true })
      .getCount();

    // Pengumuman terbaru
    const pengumumanTerbaru = await this.getPengumumanTerbaru();

    // Periode aktif (placeholder - bisa di-extend sesuai kebutuhan)
    const periodeAktif = {
      semester: semester || "genap",
      tahun_akademik: tahunAkademik || "2024/2025",
      tanggal_mulai: "2025-01-01",
      tanggal_berakhir: "2025-06-30",
      status: "aktif",
    };

    // Summary
    const sidangSelesaiTahunIni = await this.getSidangSelesaiTahunIni();
    const tingkatPenyelesaian = await this.getTingkatPenyelesaian();

    return {
      mahasiswa: {
        total: totalMahasiswa,
        terdaftar_semester_ini: mahasiswaTerdaftarSemesterIni,
        persentase_pertumbuhan: persentasePertumbuhan,
        status_breakdown: mahasiswaStatusBreakdown,
      },
      dosen: {
        total: totalDosen,
        aktif: dosenAktif,
        tersedia_bimbingan: dosenTersediaBimbingan,
        status_breakdown: dosenStatusBreakdown,
      },
      jadwal_sidang: {
        total_minggu_ini: jadwalSidangMingguIni,
        total_bulan_ini: jadwalSidangBulanIni,
        belum_dijadwalkan: belumDijadwalkan,
        status_breakdown: jadwalSidangStatusBreakdown,
      },
      pengumuman: {
        total: totalPengumuman,
        pending: pengumumanPending,
        dipublikasikan: pengumumanDipublikasikan,
        terbaru: pengumumanTerbaru,
      },
      periode_aktif: periodeAktif,
      summary: {
        mahasiswa_baru: mahasiswaBaru,
        sidang_selesai: sidangSelesaiTahunIni,
        tingkat_penyelesaian: tingkatPenyelesaian,
      },
    };
  }

  /**
   * Get system status
   */
  async getSystemStatus(): Promise<{
    api_server: "online" | "offline";
    database: "online" | "offline";
    scheduler: "online" | "offline";
  }> {
    const isApiServerOnline = await this.checkApiServerConnectivity();
    const isDatabaseOnline = await this.checkDatabaseConnectivity();
    const isSchedulerOnline = await this.checkSchedulerConnectivity();

    return {
      api_server: isApiServerOnline ? "online" : "offline",
      database: isDatabaseOnline ? "online" : "offline",
      scheduler: isSchedulerOnline ? "online" : "offline",
    };
  }

  /**
   * Get quick stats by category
   */
  async getQuickStats(category: string): Promise<any> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    switch (category) {
      case "mahasiswa_baru":
        const mahasiswaBaru = await this.studentRepository
          .createQueryBuilder("s")
          .where("s.created_at BETWEEN :start AND :end", {
            start: startOfMonth,
            end: endOfMonth,
          })
          .getCount();
        return {
          category: "mahasiswa_baru",
          total: mahasiswaBaru,
          trend: "+5%",
          last_updated: new Date().toISOString(),
        };

      case "dosen_aktif":
        const dosenAktif = await this.lecturerRepository
          .createQueryBuilder("l")
          .where(
            "l.current_supervised_1 > :zero OR l.current_supervised_2 > :zero",
            { zero: 0 }
          )
          .getCount();
        return {
          category: "dosen_aktif",
          total: dosenAktif,
          trend: "0%",
          last_updated: new Date().toISOString(),
        };

      case "sidang_selesai":
        const sidangSelesai = await this.defenseScheduleRepository
          .createQueryBuilder("ds")
          .where("ds.scheduled_date BETWEEN :start AND :end", {
            start: startOfMonth.toISOString().split("T")[0],
            end: endOfMonth.toISOString().split("T")[0],
          })
          .andWhere("ds.status = :status", { status: "completed" })
          .getCount();
        return {
          category: "sidang_selesai",
          total: sidangSelesai,
          trend: "+2%",
          last_updated: new Date().toISOString(),
        };

      case "sidang_terjadwal":
        const sidangTerjadwal = await this.defenseScheduleRepository
          .createQueryBuilder("ds")
          .where("ds.status IN (:...statuses)", {
            statuses: ["scheduled", "rescheduled"],
          })
          .getCount();
        return {
          category: "sidang_terjadwal",
          total: sidangTerjadwal,
          trend: "+8%",
          last_updated: new Date().toISOString(),
        };

      default:
        throw new Error("INVALID_CATEGORY");
    }
  }

  /**
   * Get periode information
   */
  async getPeriodeInfo(): Promise<any> {
    // Placeholder - bisa di-extend dengan tabel periode_akademik
    return {
      id: "periode_001",
      nama: "Semester Genap 2024/2025",
      tahun_akademik: "2024/2025",
      semester: "genap",
      tanggal_mulai: "2025-01-01",
      tanggal_selesai: "2025-06-30",
      status: "aktif",
      tgl_pembukaan_proposal: "2025-01-15",
      tgl_penutupan_proposal: "2025-03-31",
      tgl_pembukaan_sidang: "2025-04-01",
      tgl_penutupan_sidang: "2025-06-30",
    };
  }

  /**
   * Get dosen verification status
   */
  async getDosenVerificationStatus(): Promise<any> {
    const totalDosen = await this.lecturerRepository
      .createQueryBuilder("L")
      .getCount();

    // Dosen terverifikasi (dengan nip)
    const dosenTerverifikasi = await this.lecturerRepository
      .createQueryBuilder("l")
      .where("l.nip IS NOT NULL")
      .getCount();

    const dosenBelumVerifikasi = totalDosen - dosenTerverifikasi;

    return {
      total_dosen: totalDosen,
      terverifikasi: dosenTerverifikasi,
      belum_verifikasi: dosenBelumVerifikasi,
      percentage_terverifikasi:
        totalDosen > 0
          ? Math.round((dosenTerverifikasi / totalDosen) * 100)
          : 0,
    };
  }

  /**
   * Get jadwal sidang status
   */
  async getJadwalSidangStatus(
    minggudepan?: boolean,
    bulan?: number
  ): Promise<any> {
    let startDate = new Date();
    let endDate = new Date();

    if (minggudepan) {
      // Ambil minggu depan
      startDate = new Date();
      startDate.setDate(startDate.getDate() + 7 - startDate.getDay());
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
    } else if (bulan) {
      // Ambil bulan tertentu
      startDate = new Date(new Date().getFullYear(), bulan - 1, 1);
      endDate = new Date(new Date().getFullYear(), bulan, 0);
    } else {
      // Default: minggu ini
      startDate = new Date();
      startDate.setDate(startDate.getDate() - startDate.getDay());
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
    }

    const schedules = await this.defenseScheduleRepository
      .createQueryBuilder("ds")
      .leftJoinAndSelect("ds.defense_submission", "defense")
      .leftJoinAndSelect("defense.final_project", "fp")
      .leftJoinAndSelect("fp.members", "members")
      .leftJoinAndSelect("members.student", "student")
      .leftJoinAndSelect("student.user", "user")
      .leftJoinAndSelect("fp.supervisor_1", "sup1")
      .leftJoinAndSelect("sup1.user", "sup1_user")
      .leftJoinAndSelect("fp.supervisor_2", "sup2")
      .leftJoinAndSelect("sup2.user", "sup2_user")
      .where("ds.scheduled_date BETWEEN :start AND :end", {
        start: startDate.toISOString().split("T")[0],
        end: endDate.toISOString().split("T")[0],
      })
      .orderBy("ds.scheduled_date", "ASC")
      .addOrderBy("ds.start_time", "ASC")
      .getMany();

    const total = schedules.length;

    // Get hari pertama sidang (first scheduled date)
    const hariPertamaSidang =
      schedules.length > 0 ? schedules[0].scheduled_date : null;

    // Check overall status
    const overallStatus =
      schedules.length > 0 && schedules.some((s) => s.status === "scheduled")
        ? "Terjadwal"
        : schedules.length > 0 &&
          schedules.every((s) => s.status === "completed")
        ? "Selesai"
        : "Belum Dimulai";

    // Check if rooms are available (all schedules have room assigned)
    const ruangTersedia =
      schedules.length > 0 && schedules.every((s) => s.room && s.room !== "");

    // Build detailed schedule list
    const daftarSidang = schedules.map((schedule) => {
      const member = schedule.defense_submission?.final_project?.members?.[0];
      const finalProject = schedule.defense_submission?.final_project;
      const sup1User = finalProject?.supervisor_1?.user;
      const sup2User = finalProject?.supervisor_2?.user;

      return {
        id: schedule.id.toString(),
        mahasiswa_nim: member?.student?.nim || "-",
        judul_ta: member?.title || "Tidak Ada Judul",
        pembimbing_1: sup1User?.name || "Belum Ditentukan",
        pembimbing_2: sup2User?.name || "Belum Ditentukan",
        tanggal_sidang: schedule.scheduled_date,
        ruang: schedule.room || "Prodi",
        status: schedule.status,
      };
    });

    return {
      total_terjadwal_minggu_ini: total,
      hari_pertama_sidang: hariPertamaSidang,
      status: overallStatus,
      ruang_tersedia: ruangTersedia,
      daftar_sidang: daftarSidang,
    };
  }

  // ========== HELPER METHODS ==========

  private async getTotalSedangSidang(): Promise<number> {
    return await this.defenseScheduleRepository
      .createQueryBuilder("ds")
      .where("ds.status IN (:...statuses)", {
        statuses: ["scheduled", "rescheduled"],
      })
      .getCount();
  }

  private async getSidangSelesaiTahunIni(): Promise<number> {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const endOfYear = new Date(new Date().getFullYear(), 11, 31);

    return await this.defenseScheduleRepository
      .createQueryBuilder("ds")
      .where("ds.scheduled_date BETWEEN :start AND :end", {
        start: startOfYear.toISOString().split("T")[0],
        end: endOfYear.toISOString().split("T")[0],
      })
      .andWhere("ds.status = :status", { status: "completed" })
      .getCount();
  }

  private async getDosenBelumVerifikasi(): Promise<number> {
    return await this.lecturerRepository
      .createQueryBuilder("l")
      .where("l.nip IS NULL OR l.nip = ''")
      .getCount();
  }

  private async getDosenDenganBebanMaksimal(): Promise<number> {
    return await this.lecturerRepository
      .createQueryBuilder("l")
      .where(
        "(l.current_supervised_1 >= l.max_supervised_1) OR (l.current_supervised_2 >= l.max_supervised_2)"
      )
      .getCount();
  }

  private async getTotalSidangBulanIni(): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return await this.defenseScheduleRepository
      .createQueryBuilder("ds")
      .where("ds.scheduled_date BETWEEN :start AND :end", {
        start: startOfMonth.toISOString().split("T")[0],
        end: endOfMonth.toISOString().split("T")[0],
      })
      .getCount();
  }

  private async getSidangBelumTerjadwal(): Promise<number> {
    return await this.finalProjectRepository
      .createQueryBuilder("fp")
      .where("fp.status = :status", { status: "pending" })
      .getCount();
  }

  private async getPengumumanBulanIni(): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return await this.announcementRepository
      .createQueryBuilder("a")
      .where("a.created_at BETWEEN :start AND :end", {
        start: startOfMonth,
        end: endOfMonth,
      })
      .andWhere("a.is_published = :is_published", { is_published: true })
      .getCount();
  }

  /**
   * Mahasiswa terdaftar semester ini
   */
  private async getMahasiswaTerdaftarSemesterIni(): Promise<number> {
    const currentSemester = 7; // Default semester
    return await this.studentRepository
      .createQueryBuilder("s")
      .where("s.semester = :semester", { semester: currentSemester })
      .getCount();
  }

  /**
   * Mahasiswa status breakdown (aktif, cuti, lulus)
   */
  private async getMahasiswaStatusBreakdown(): Promise<any> {
    // Placeholder - bisa di-extend dengan status di user table jika ada
    const total = await this.studentRepository
      .createQueryBuilder("s")
      .getCount();
    return {
      aktif: Math.round(total * 0.85),
      cuti: Math.round(total * 0.1),
      lulus: Math.round(total * 0.05),
    };
  }

  /**
   * Persentase pertumbuhan mahasiswa (minggu ini vs minggu lalu)
   */
  private async getPersentasePertumbuhanMahasiswa(): Promise<number> {
    const currentWeekStart = new Date();
    currentWeekStart.setDate(
      currentWeekStart.getDate() - currentWeekStart.getDay()
    );
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);

    const prevWeekStart = new Date(currentWeekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekEnd = new Date(prevWeekStart);
    prevWeekEnd.setDate(prevWeekEnd.getDate() + 6);

    const currentWeek = await this.studentRepository
      .createQueryBuilder("s")
      .where("s.created_at BETWEEN :start AND :end", {
        start: currentWeekStart,
        end: currentWeekEnd,
      })
      .getCount();

    const prevWeek = await this.studentRepository
      .createQueryBuilder("s")
      .where("s.created_at BETWEEN :start AND :end", {
        start: prevWeekStart,
        end: prevWeekEnd,
      })
      .getCount();

    if (prevWeek === 0) return currentWeek > 0 ? 100 : 0;
    return Math.round(((currentWeek - prevWeek) / prevWeek) * 100);
  }

  /**
   * Dosen tersedia bimbingan (belum penuh)
   */
  private async getDosenTersediaBimbingan(): Promise<number> {
    return await this.lecturerRepository
      .createQueryBuilder("l")
      .where(
        "l.current_supervised_1 < l.max_supervised_1 OR l.current_supervised_2 < l.max_supervised_2"
      )
      .getCount();
  }

  /**
   * Dosen status breakdown (aktif, tidak aktif, cuti)
   */
  private async getDosenStatusBreakdown(): Promise<any> {
    // Placeholder - bisa di-extend dengan status di user table jika ada
    const total = await this.lecturerRepository
      .createQueryBuilder("l")
      .getCount();
    const aktif = await this.lecturerRepository
      .createQueryBuilder("l")
      .where(
        "l.current_supervised_1 > :zero OR l.current_supervised_2 > :zero",
        {
          zero: 0,
        }
      )
      .getCount();

    return {
      aktif: aktif,
      tidak_aktif: total - aktif,
      cuti: 0,
    };
  }

  /**
   * Jadwal sidang status breakdown (terjadwal, selesai, dibatalkan)
   */
  private async getJadwalSidangStatusBreakdown(): Promise<any> {
    const terjadwal = await this.defenseScheduleRepository
      .createQueryBuilder("ds")
      .where("ds.status IN (:...statuses)", {
        statuses: ["scheduled", "rescheduled"],
      })
      .getCount();

    const selesai = await this.defenseScheduleRepository
      .createQueryBuilder("ds")
      .where("ds.status = :status", { status: "completed" })
      .getCount();

    const dibatalkan = await this.defenseScheduleRepository
      .createQueryBuilder("ds")
      .where("ds.status = :status", { status: "cancelled" })
      .getCount();

    return {
      terjadwal,
      selesai,
      dibatalkan,
    };
  }

  /**
   * Pengumuman terbaru
   */
  private async getPengumumanTerbaru(): Promise<any> {
    const terbaru = await this.announcementRepository
      .createQueryBuilder("a")
      .where("a.is_published = :is_published", { is_published: true })
      .orderBy("a.created_at", "DESC")
      .limit(1)
      .getOne();

    if (!terbaru) {
      return {
        id: null,
        judul: null,
        created_at: null,
      };
    }

    return {
      id: terbaru.id.toString(),
      judul: terbaru.title,
      created_at: terbaru.created_at,
    };
  }

  /**
   * Tingkat penyelesaian (persentase)
   */
  private async getTingkatPenyelesaian(): Promise<string> {
    const totalFinalProject = await this.finalProjectRepository
      .createQueryBuilder("fp")
      .getCount();
    if (totalFinalProject === 0) return "0%";

    const completedFinalProject = await this.finalProjectRepository
      .createQueryBuilder("fp")
      .where("fp.status = :status", { status: "lulus" })
      .getCount();

    const percentage = Math.round(
      (completedFinalProject / totalFinalProject) * 100
    );
    return `${percentage}%`;
  }

  /**
   * Get recent announcements (published only)
   */
  async getRecentAnnouncements(limit: number = 2): Promise<any[]> {
    const announcements = await this.announcementRepository
      .createQueryBuilder("a")
      .leftJoinAndSelect("a.user", "user")
      .where("a.is_published = :is_published", { is_published: true })
      .orderBy("a.priority", "DESC")
      .limit(Math.min(limit, 10)) // Max limit 10
      .getMany();

    return announcements.map((ann) => ({
      id: ann.id,
      title: ann.title,
      content: ann.content,
      priority: ann.priority,
      author: ann.user?.name || "Admin",
      created_at: ann.created_at,
      updated_at: ann.updated_at,
    }));
  }

  /**
   * Check API Server connectivity
   * Verifies if the current API server is responsive
   */
  private async checkApiServerConnectivity(): Promise<boolean> {
    try {
      // Attempt a simple query to verify database connectivity
      // This acts as a server health check
      const user = await this.userRepository.findOne({ where: {} });
      return true;
    } catch (error) {
      console.error("❌ API Server connectivity check failed:", error);
      return false;
    }
  }

  /**
   * Check Database connectivity
   * Verifies if the database connection is active and responsive
   */
  private async checkDatabaseConnectivity(): Promise<boolean> {
    try {
      // Check if DataSource is initialized
      if (!AppDataSource.isInitialized) {
        console.error("❌ Database not initialized");
        return false;
      }

      // Attempt a simple query to verify database connectivity
      await AppDataSource.query("SELECT 1");
      return true;
    } catch (error) {
      console.error("❌ Database connectivity check failed:", error);
      return false;
    }
  }

  /**
   * Check Scheduler API connectivity
   * Attempts to connect to the external Scheduler API
   */
  private async checkSchedulerConnectivity(): Promise<boolean> {
    try {
      const schedulerUrl = process.env.SCHEDULER_API_URL;

      if (!schedulerUrl) {
        console.warn("⚠️ SCHEDULER_API_URL not configured in environment");
        return false;
      }

      // Create an AbortController with a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(`${schedulerUrl.replace(/\/$/, "")}/`, {
          method: "GET",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Consider any successful response as online
        return response.ok;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      console.error("❌ Scheduler API connectivity check failed:", error);
      return false;
    }
  }
}

import { Repository, QueryRunner } from "typeorm";
import AppDataSource from "../config/database";
import { DefenseSchedule } from "../entities/defenseSchedule";
import { GuidanceSession } from "../entities/guidance";
import { FinalProjects } from "../entities/finalProject";
import { Lecturer } from "../entities/lecturer";

export class LecturerDashboardRepository {
  public repository: Repository<DefenseSchedule>;
  private guidanceRepository: Repository<GuidanceSession>;
  private finalProjectRepository: Repository<FinalProjects>;
  private lecturerRepository: Repository<Lecturer>;

  constructor(private queryRunner?: QueryRunner) {
    if (queryRunner) {
      this.repository = queryRunner.manager.getRepository(DefenseSchedule);
      this.guidanceRepository =
        queryRunner.manager.getRepository(GuidanceSession);
      this.finalProjectRepository =
        queryRunner.manager.getRepository(FinalProjects);
      this.lecturerRepository = queryRunner.manager.getRepository(Lecturer);
    } else {
      this.repository = AppDataSource.getRepository(DefenseSchedule);
      this.guidanceRepository = AppDataSource.getRepository(GuidanceSession);
      this.finalProjectRepository = AppDataSource.getRepository(FinalProjects);
      this.lecturerRepository = AppDataSource.getRepository(Lecturer);
    }
  }

  /**
   * Get dashboard stats untuk dosen
   */
  async getDashboardStats(lecturerId: number): Promise<any> {
    const lecturer = await this.lecturerRepository.findOne({
      where: { id: lecturerId },
    });

    if (!lecturer) {
      throw new Error("LECTURER_NOT_FOUND");
    }

    // Total mahasiswa bimbingan aktif (proposal + hasil)
    const activeStudents = await this.finalProjectRepository
      .createQueryBuilder("fp")
      .leftJoinAndSelect("fp.members", "members")
      .leftJoinAndSelect("members.student", "student")
      .where(
        "(fp.supervisor_1 = :lecturerId OR fp.supervisor_2 = :lecturerId)",
        {
          lecturerId,
        }
      )
      .andWhere(
        "fp.supervisor_1_status = :approved OR fp.supervisor_2_status = :approved",
        {
          approved: "approved",
        }
      )
      .getMany();

    // Mahasiswa tahap proposal
    const proposalStudents = activeStudents.filter((fp) =>
      fp.guidance_sessions?.some((gs) => gs.defense_type === "proposal")
    ).length;

    // Mahasiswa tahap hasil
    const resultsStudents = activeStudents.filter((fp) =>
      fp.guidance_sessions?.some((gs) => gs.defense_type === "hasil")
    ).length;

    // Jadwal sidang bulan ini
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const upcomingSchedulesThisMonth = await this.repository
      .createQueryBuilder("ds")
      .leftJoinAndSelect("ds.defense_submission", "defense")
      .leftJoinAndSelect("defense.final_project", "fp")
      .where("ds.scheduled_date BETWEEN :start AND :end", {
        start: startOfMonth.toISOString().split("T")[0],
        end: endOfMonth.toISOString().split("T")[0],
      })
      .andWhere(
        "(fp.supervisor_1 = :lecturerId OR fp.supervisor_2 = :lecturerId)",
        { lecturerId }
      )
      .getCount();

    // Hari sampai sidang berikutnya
    const today = new Date().toISOString().split("T")[0];
    const nextSchedule = await this.repository
      .createQueryBuilder("ds")
      .leftJoinAndSelect("ds.defense_submission", "defense")
      .leftJoinAndSelect("defense.final_project", "fp")
      .where("ds.scheduled_date >= :today", { today })
      .andWhere(
        "(fp.supervisor_1 = :lecturerId OR fp.supervisor_2 = :lecturerId)",
        { lecturerId }
      )
      .orderBy("ds.scheduled_date", "ASC")
      .limit(1)
      .getOne();

    let upcomingSchedulesDaysAhead = 0;
    if (nextSchedule) {
      const nextDate = new Date(nextSchedule.scheduled_date);
      const todayDate = new Date();
      const diffTime = nextDate.getTime() - todayDate.getTime();
      upcomingSchedulesDaysAhead = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
      totalNewApplicants: 0, // Placeholder - perlu query aplikasi
      newApplicantsThisWeek: 0, // Placeholder
      totalActiveStudents: activeStudents.length,
      proposalStudents,
      resultsStudents,
      upcomingSchedulesThisMonth,
      upcomingSchedulesDaysAhead,
      completedGraduates: 0, // Placeholder
      semesterInfo: "Semester genap 2024", // Placeholder
    };
  }

  /**
   * Get upcoming schedules untuk dosen
   */
  async getUpcomingSchedules(
    lecturerId: number,
    limit: number = 10,
    status?: string,
    jenis?: string
  ): Promise<any[]> {
    const today = new Date().toISOString().split("T")[0];

    let query = this.repository
      .createQueryBuilder("ds")
      .leftJoinAndSelect("ds.defense_submission", "defense")
      .leftJoinAndSelect("defense.final_project", "fp")
      .leftJoinAndSelect("fp.members", "members")
      .leftJoinAndSelect("members.student", "student")
      .leftJoinAndSelect("student.user", "user")
      .leftJoinAndSelect("fp.supervisor_1", "sup1")
      .leftJoinAndSelect("sup1.user", "sup1User")
      .leftJoinAndSelect("fp.supervisor_2", "sup2")
      .leftJoinAndSelect("sup2.user", "sup2User")
      .where("ds.scheduled_date >= :today", { today })
      .andWhere(
        "(fp.supervisor_1 = :lecturerId OR fp.supervisor_2 = :lecturerId OR defense.examiner_1 = :lecturerId OR defense.examiner_2 = :lecturerId)",
        { lecturerId }
      )
      .orderBy("ds.scheduled_date", "ASC")
      .addOrderBy("ds.start_time", "ASC");

    if (status) {
      query = query.andWhere("ds.status = :status", { status });
    }

    if (jenis) {
      query = query.andWhere("defense.defense_type = :jenis", { jenis });
    }

    query = query.limit(limit);

    const schedules = await query.getMany();

    return schedules.map((schedule) => {
      const member = schedule.defense_submission.final_project.members?.[0];
      const student = member?.student;

      return {
        id: schedule.id,
        scheduleId: schedule.id,
        studentName: student?.user?.name || "Unknown",
        jenisSidang: schedule.defense_submission.defense_type,
        title: member?.title || "Untitled",
        supervisor:
          schedule.defense_submission.final_project.supervisor_1?.user?.name ||
          "Unknown",
        supervisorId:
          schedule.defense_submission.final_project.supervisor_1?.id,
        date: schedule.scheduled_date,
        time: schedule.start_time,
        endTime: schedule.end_time,
        room: schedule.room || "Prodi",
        status: schedule.status,
      };
    });
  }

  /**
   * Get guided students untuk dosen
   */
  async getGuidedStudents(
    lecturerId: number,
    status?: string,
    jenis?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    let query = this.finalProjectRepository
      .createQueryBuilder("fp")
      .leftJoinAndSelect("fp.members", "members")
      .leftJoinAndSelect("members.student", "student")
      .leftJoinAndSelect("student.user", "user")
      .leftJoinAndSelect("fp.guidance_sessions", "gs")
      .where(
        "(fp.supervisor_1 = :lecturerId OR fp.supervisor_2 = :lecturerId)",
        {
          lecturerId,
        }
      )
      .andWhere(
        "fp.supervisor_1_status = :approved OR fp.supervisor_2_status = :approved",
        { approved: "approved" }
      );

    if (jenis) {
      query = query.andWhere("gs.defense_type = :jenis", { jenis });
    }

    if (status) {
      // Map status dari API ke database status
      query = query.andWhere("fp.status = :status", { status });
    }

    const students = await query.skip(offset).take(limit).getMany();

    return students.map((fp) => {
      const member = fp.members?.[0];
      const student = member?.student;
      const latestGuidance = fp.guidance_sessions?.sort(
        (a, b) =>
          new Date(b.session_date).getTime() -
          new Date(a.session_date).getTime()
      )?.[0];

      return {
        id: member?.id,
        studentId: student?.id,
        name: student?.user?.name,
        nim: student?.nim,
        email: student?.user?.email,
        jenisSidang: latestGuidance?.defense_type || "proposal",
        status: fp.status,
        lastBimbinganDate: latestGuidance?.session_date,
      };
    });
  }

  /**
   * Get guided students summary
   */
  async getGuidedStudentsSummary(lecturerId: number): Promise<any[]> {
    const students = await this.finalProjectRepository
      .createQueryBuilder("fp")
      .leftJoinAndSelect("fp.guidance_sessions", "gs")
      .where(
        "(fp.supervisor_1 = :lecturerId OR fp.supervisor_2 = :lecturerId)",
        {
          lecturerId,
        }
      )
      .andWhere(
        "fp.supervisor_1_status = :approved OR fp.supervisor_2_status = :approved",
        { approved: "approved" }
      )
      .getMany();

    // Group by defense type
    const proposalStudents = students.filter((fp) =>
      fp.guidance_sessions?.some((gs) => gs.defense_type === "proposal")
    ).length;

    const resultsStudents = students.filter((fp) =>
      fp.guidance_sessions?.some((gs) => gs.defense_type === "hasil")
    ).length;

    const total = proposalStudents + resultsStudents;

    return [
      {
        id: 1,
        type: "proposal",
        totalCount: proposalStudents,
        percentage:
          total > 0 ? Math.round((proposalStudents / total) * 100) : 0,
      },
      {
        id: 2,
        type: "hasil",
        totalCount: resultsStudents,
        percentage: total > 0 ? Math.round((resultsStudents / total) * 100) : 0,
      },
    ];
  }
}

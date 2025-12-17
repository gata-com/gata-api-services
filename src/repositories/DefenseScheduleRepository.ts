import { Repository } from "typeorm";
import AppDataSource from "../config/database";
import { DefenseSchedule } from "@/entities/defenseSchedule";
import { DefenseSubmission } from "@/entities/defenses";
import { Lecturer } from "@/entities/lecturer";

export class DefenseScheduleRepository {
  public repository: Repository<DefenseSchedule>;
  private defenseRepo: Repository<DefenseSubmission>;
  private lecturerRepo: Repository<Lecturer>;

  constructor() {
    this.repository = AppDataSource.getRepository(DefenseSchedule);
    this.defenseRepo = AppDataSource.getRepository(DefenseSubmission);
    this.lecturerRepo = AppDataSource.getRepository(Lecturer);
  }

  /**
   * Create or update defense schedule from scheduler result
   * @param data Schedule data from CSV
   * @returns DefenseSchedule
   */
  async upsertSchedule(data: {
    nim: string;
    scheduled_date: string;
    start_time: string;
    end_time: string;
    scheduler_status: string;
    examiner_1: string;
    examiner_2: string;
  }): Promise<DefenseSchedule | null> {
    // Find defense submission by nim student
    const defenseSubmission = await this.defenseRepo
      .createQueryBuilder("def")
      .leftJoinAndSelect("def.final_project", "fp")
      .leftJoinAndSelect("fp.members", "members")
      .leftJoinAndSelect("members.student", "student")
      .where("student.nim = :nim", { nim: data.nim })
      .getOne();

    if (!defenseSubmission) {
      console.warn(`Defense submission not found for nim: ${data.nim}`);
      return null;
    }

    // Check if schedule already exists
    let schedule = await this.repository.findOne({
      where: { defense_submission: { id: defenseSubmission.id } },
    });

    let examiner1 = await this.lecturerRepo.findOne({
      where: { lecturer_code: data.examiner_1 },
    });

    let examiner2 = await this.lecturerRepo.findOne({
      where: { lecturer_code: data.examiner_2 },
    });

    if (schedule) {
      // Update existing
      schedule.scheduled_date = data.scheduled_date;
      schedule.start_time = data.start_time;
      schedule.end_time = data.end_time;
      schedule.scheduler_status = data.scheduler_status;
      schedule.status = "rescheduled";
    } else {
      // Create new
      schedule = this.repository.create({
        defense_submission: defenseSubmission,
        scheduled_date: data.scheduled_date,
        start_time: data.start_time,
        end_time: data.end_time,
        scheduler_status: data.scheduler_status,
        status: "scheduled",
      });
    }

    if(examiner1 && examiner2) {
      defenseSubmission.examiner_1 = examiner1;
      defenseSubmission.examiner_2 = examiner2;
      await this.defenseRepo.save(defenseSubmission);
    }

    return this.repository.save(schedule);
  }

  /**
   * Create new defense schedule
   * @param defenseSubmissionId - Defense Submission ID
   * @param data - Schedule data { scheduled_date, start_time, end_time, room }
   * @returns DefenseSchedule
   */
  async createSchedule(
    defenseSubmissionId: number,
    data: {
      scheduled_date: string;
      start_time: string;
      end_time: string;
      room?: string;
      notes?: string;
    }
  ): Promise<DefenseSchedule> {
    // Check if schedule already exists
    const existingSchedule = await this.repository.findOne({
      where: { defense_submission: { id: defenseSubmissionId } },
    });

    if (existingSchedule) {
      throw new Error("Schedule sudah ada untuk defense submission ini");
    }

    // Create new schedule
    const schedule = this.repository.create({
      defense_submission: { id: defenseSubmissionId },
      scheduled_date: data.scheduled_date,
      start_time: data.start_time,
      end_time: data.end_time,
      room: data.room || "Prodi",
      notes: data.notes,
      scheduler_status: "manual",
      status: "scheduled",
    });

    return this.repository.save(schedule);
  }

  /**
   * Get all schedules with relations
   * @param filters Optional filters
   * @returns Array of schedules
   */
  async findAll(filters?: {
    status?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<DefenseSchedule[]> {
    const query = this.repository
      .createQueryBuilder("ds")
      .leftJoinAndSelect("ds.defense_submission", "def")
      .leftJoinAndSelect("def.final_project", "fp")
      .leftJoinAndSelect("fp.supervisor_1", "supervisor_1")
      .leftJoinAndSelect("supervisor_1.user", "supervisor_1_user")
      .leftJoinAndSelect("fp.supervisor_2", "supervisor_2")
      .leftJoinAndSelect("supervisor_2.user", "supervisor_2_user")
      .leftJoinAndSelect("fp.members", "members")
      .leftJoinAndSelect("members.student", "student")
      .leftJoinAndSelect("student.user", "user")
      .leftJoinAndSelect("def.lecturer", "lecturer")
      .leftJoinAndSelect("lecturer.user", "lecturerUser")
      .leftJoinAndSelect("def.examiner_1", "examiner1")
      .leftJoinAndSelect("examiner1.user", "examiner1User")
      .leftJoinAndSelect("def.examiner_2", "examiner2")
      .leftJoinAndSelect("examiner2.user", "examiner2User")
      .orderBy("ds.scheduled_date", "ASC")
      .addOrderBy("ds.start_time", "ASC");

    if (filters?.status) {
      query.andWhere("ds.status = :status", { status: filters.status });
    }

    if (filters?.date_from) {
      query.andWhere("ds.scheduled_date >= :date_from", {
        date_from: filters.date_from,
      });
    }

    if (filters?.date_to) {
      query.andWhere("ds.scheduled_date <= :date_to", {
        date_to: filters.date_to,
      });
    }

    return query.getMany();
  }

  /**
   * Get schedule by defense submission ID
   * @param defenseSubmissionId
   * @returns DefenseSchedule or null
   */
  async findByDefenseSubmissionId(
    DSId: number
  ): Promise<DefenseSchedule | null> {
    return this.repository
      .createQueryBuilder("ds")
      .leftJoinAndSelect("ds.defense_submission", "def")
      .leftJoinAndSelect("def.final_project", "fp")
      .leftJoinAndSelect("fp.supervisor_1", "supervisor_1")
      .leftJoinAndSelect("supervisor_1.user", "supervisor_1_user")
      .leftJoinAndSelect("fp.supervisor_2", "supervisor_2")
      .leftJoinAndSelect("supervisor_2.user", "supervisor_2_user")
      .leftJoinAndSelect("def.examiner_1", "examiner_1")
      .leftJoinAndSelect("examiner_1.user", "examiner_1_user")
      .leftJoinAndSelect("def.examiner_2", "examiner_2")
      .leftJoinAndSelect("examiner_2.user", "examiner_2_user")
      .leftJoinAndSelect("fp.members", "members")
      .leftJoinAndSelect("members.student", "student")
      .leftJoinAndSelect("student.user", "student_user")
      .where("ds.id = :DSId", { DSId })
      .getOne();
  }

  /**
   * Update schedule status
   * @param id Schedule ID
   * @param status New status
   */
  async updateStatus(
    id: number,
    status: "scheduled" | "rescheduled" | "cancelled" | "completed"
  ): Promise<void> {
    await this.repository.update(id, { status });
  }

  /**
   * Find schedule by ID with all relations
   * @param id Schedule ID
   * @returns DefenseSchedule or null
   */
  async findById(id: number): Promise<DefenseSchedule | null> {
    return this.repository
      .createQueryBuilder("ds")
      .leftJoinAndSelect("ds.defense_submission", "def")
      .leftJoinAndSelect("def.final_project", "fp")
      .leftJoinAndSelect("fp.members", "members")
      .leftJoinAndSelect("members.student", "student")
      .leftJoinAndSelect("student.user", "studentUser")
      .leftJoinAndSelect("fp.supervisor_1", "supervisor_1")
      .leftJoinAndSelect("supervisor_1.user", "supervisor_1_user")
      .leftJoinAndSelect("fp.supervisor_2", "supervisor_2")
      .leftJoinAndSelect("supervisor_2.user", "supervisor_2_user")
      .leftJoinAndSelect("def.examiner_1", "examiner_1")
      .leftJoinAndSelect("examiner_1.user", "examiner_1_user")
      .leftJoinAndSelect("def.examiner_2", "examiner_2")
      .leftJoinAndSelect("examiner_2.user", "examiner_2_user")
      .leftJoinAndSelect("def.expertises_group_1", "eg1")
      .leftJoinAndSelect("def.expertises_group_2", "eg2")
      .where("ds.id = :id", { id })
      .getOne();
  }

  /**
   * Update defense schedule
   * @param id Schedule ID
   * @param data Updated schedule data
   * @returns DefenseSchedule
   */
  async updateSchedule(
    id: number,
    data: {
      scheduled_date?: string;
      start_time?: string;
      end_time?: string;
      room?: string;
      notes?: string;
    }
  ): Promise<DefenseSchedule | null> {
    const updateData: any = {};

    if (data.scheduled_date) updateData.scheduled_date = data.scheduled_date;
    if (data.start_time) updateData.start_time = data.start_time;
    if (data.end_time) updateData.end_time = data.end_time;
    if (data.room) updateData.room = data.room;
    if (data.notes !== undefined) updateData.notes = data.notes;

    // Update status to rescheduled if changing date/time
    if (data.scheduled_date || data.start_time || data.end_time) {
      updateData.status = "rescheduled";
    }

    await this.repository.update(id, updateData);

    return this.findById(id);
  }

  /**
   * Delete schedule
   * @param id Schedule ID
   */
  async deleteSchedule(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  /**
   * Find defense schedules where lecturer is supervisor or examiner
   * @param lecturerId Lecturer ID
   * @returns Array of DefenseSchedule
   */
  async findByLecturerId(lecturerId: number): Promise<DefenseSchedule[]> {
    return this.repository
      .createQueryBuilder("ds")
      .leftJoinAndSelect("ds.defense_submission", "def")
      .leftJoinAndSelect("def.final_project", "fp")
      .leftJoinAndSelect("fp.supervisor_1", "supervisor_1")
      .leftJoinAndSelect("supervisor_1.user", "supervisor_1_user")
      .leftJoinAndSelect("fp.supervisor_2", "supervisor_2")
      .leftJoinAndSelect("supervisor_2.user", "supervisor_2_user")
      .leftJoinAndSelect("def.examiner_1", "examiner_1")
      .leftJoinAndSelect("examiner_1.user", "examiner_1_user")
      .leftJoinAndSelect("def.examiner_2", "examiner_2")
      .leftJoinAndSelect("examiner_2.user", "examiner_2_user")
      .leftJoinAndSelect("fp.members", "members")
      .leftJoinAndSelect("members.student", "student")
      .leftJoinAndSelect("student.user", "student_user")
      .leftJoinAndSelect("def.documents", "documents")
      .where("supervisor_1.id = :lecturerId", { lecturerId })
      .orWhere("supervisor_2.id = :lecturerId", { lecturerId })
      .orWhere("examiner_1.id = :lecturerId", { lecturerId })
      .orWhere("examiner_2.id = :lecturerId", { lecturerId })
      .orderBy("ds.scheduled_date", "ASC")
      .addOrderBy("ds.start_time", "ASC")
      .getMany();
  }
}

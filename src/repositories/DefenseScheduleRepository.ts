import { Repository } from "typeorm";
import AppDataSource from "../config/database";
import { DefenseSchedule } from "@/entities/defenseSchedule";
import { DefenseSubmission } from "@/entities/defenses";

export class DefenseScheduleRepository {
  public repository: Repository<DefenseSchedule>;
  private defenseRepo: Repository<DefenseSubmission>;

  constructor() {
    this.repository = AppDataSource.getRepository(DefenseSchedule);
    this.defenseRepo = AppDataSource.getRepository(DefenseSubmission);
  }

  /**
   * Create or update defense schedule from scheduler result
   * @param data Schedule data from CSV
   * @returns DefenseSchedule
   */
  async upsertSchedule(data: {
    capstone_code: string;
    scheduled_date: string;
    start_time: string;
    end_time: string;
    scheduler_status: string;
    original_idx?: number;
    room?: string;
    notes?: string;
  }): Promise<DefenseSchedule | null> {
    // Find defense submission by capstone_code
    const defenseSubmission = await this.defenseRepo.findOne({
      where: { capstone_code: data.capstone_code },
    });

    if (!defenseSubmission) {
      console.warn(
        `Defense submission not found for capstone_code: ${data.capstone_code}`
      );
      return null;
    }

    // Check if schedule already exists
    let schedule = await this.repository.findOne({
      where: { defense_submission: { id: defenseSubmission.id } },
    });

    if (schedule) {
      // Update existing
      schedule.scheduled_date = data.scheduled_date;
      schedule.start_time = data.start_time;
      schedule.end_time = data.end_time;
      schedule.scheduler_status = data.scheduler_status;
      schedule.original_idx = data.original_idx;
      schedule.room = data.room;
      schedule.notes = data.notes;
      schedule.status = "rescheduled";
    } else {
      // Create new
      schedule = this.repository.create({
        defense_submission: defenseSubmission,
        scheduled_date: data.scheduled_date,
        start_time: data.start_time,
        end_time: data.end_time,
        scheduler_status: data.scheduler_status,
        original_idx: data.original_idx,
        room: data.room,
        notes: data.notes,
        status: "scheduled",
      });
    }

    // Update defense_date di defense_submission juga
    await this.defenseRepo.update(defenseSubmission.id, {
      defense_date: new Date(`${data.scheduled_date} ${data.start_time}`),
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
      .leftJoinAndSelect("fp.members", "members")
      .leftJoinAndSelect("members.student", "student")
      .leftJoinAndSelect("student.user", "user")
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
    defenseSubmissionId: number
  ): Promise<DefenseSchedule | null> {
    return this.repository.findOne({
      where: { defense_submission: { id: defenseSubmissionId } },
      relations: [
        "defense_submission",
        "defense_submission.final_project",
        "defense_submission.final_project.members",
        "defense_submission.final_project.members.student",
        "defense_submission.final_project.members.student.user",
        "defense_submission.examiner_1",
        "defense_submission.examiner_1.user",
        "defense_submission.examiner_2",
        "defense_submission.examiner_2.user",
      ],
    });
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
   * Delete schedule
   * @param id Schedule ID
   */
  async deleteSchedule(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}

import { Repository, QueryRunner } from "typeorm";
import AppDataSource from "../config/database";
import { GuidanceSession } from "@/entities/guidance";
import { GuidanceSessionCreateRequest } from "@/types/student";
import { GuidanceActionRequest } from "@/types/lecturer";

export class GuidanceSessionsRepository {
  public repository: Repository<GuidanceSession>;

  public AppDataSource: any;

  constructor(private queryRunner?: QueryRunner) {
    if (queryRunner) {
      this.repository = queryRunner.manager.getRepository(GuidanceSession);
    } else {
      this.repository = AppDataSource.getRepository(GuidanceSession);
    }

    this.AppDataSource = AppDataSource;
  }

  /**
   * CREATE n UPDATE n DELETE
   *
   * @returns
   */
  async createSubmission(
    data: GuidanceSessionCreateRequest,
    session_date: Date
  ): Promise<any> {
    const qr = AppDataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    const { fpId, GAId, lecturerId, topic, supervisor_type } = data;
    try {
      const newSubmission = await qr.manager.insert(GuidanceSession, {
        supervisor_type,
        topic,
        session_date,
        guidance_availability: { id: GAId },
        lecturer: { id: lecturerId },
        final_project: { id: fpId },
      });

      await qr.commitTransaction();

      return newSubmission;
    } catch (error) {
      await qr.rollbackTransaction();
      throw error;
    } finally {
      await qr.release();
    }
  }

  async updateStatus(data: GuidanceActionRequest): Promise<any> {
    const qr = AppDataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    const { id, status, lecturer_feedback } = data;
    try {
      const result = await qr.manager.update(
        GuidanceSession,
        { id },
        {
          status,
          lecturer_feedback,
        }
      );

      await qr.commitTransaction();

      return result;
    } catch (error) {
      await qr.rollbackTransaction();
      throw error;
    } finally {
      await qr.release();
    }
  }

  /**
   * FIND
   *
   * @returns
   */

  async findByGAId(GAId: number): Promise<any> {
    return this.repository.findOne({
      where: {
        guidance_availability: { id: GAId },
      },
    });
  }

  async findByLecturerId(lecturerId: number): Promise<any> {
    return this.repository
      .createQueryBuilder("gs")
      .leftJoinAndSelect("gs.guidance_availability", "ga")
      .leftJoinAndSelect("gs.final_project", "fp")
      .leftJoinAndSelect("fp.members", "fpm")
      .leftJoinAndSelect("fpm.student", "student")
      .leftJoinAndSelect("student.user", "studentUser")
      .leftJoinAndSelect("gs.draft_links", "draftLinks")
      .where("gs.lecturerId = :lecturerId", { lecturerId })
      .orderBy("gs.session_date", "DESC")
      .addOrderBy("ga.start_time", "ASC")
      .getMany();
  }

  async findByStudentIdWithLecturer(studentId: number): Promise<any> {
    return this.repository
      .createQueryBuilder("gs")
      .leftJoinAndSelect("gs.guidance_availability", "ga")
      .leftJoinAndSelect("gs.lecturer", "lecturer")
      .leftJoinAndSelect("lecturer.user", "lecturerUser")
      .leftJoinAndSelect("gs.final_project", "fp")
      .leftJoinAndSelect("fp.members", "fpm")
      .leftJoinAndSelect("fpm.student", "student")
      .leftJoinAndSelect("gs.draft_links", "draftLinks")
      .where("fpm.studentId = :studentId", { studentId })
      .orderBy("gs.session_date", "DESC")
      .addOrderBy("ga.start_time", "ASC")
      .getMany();
  }
}

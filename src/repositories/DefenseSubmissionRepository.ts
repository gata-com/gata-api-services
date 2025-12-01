import { Repository, QueryRunner } from "typeorm";
import AppDataSource from "../config/database";
import {
  DefenseSubmission,
  DefenseSubmissionDocument,
} from "@/entities/defenses";

export class DefenseSubmissionRepository {
  public repository: Repository<DefenseSubmission>;
  public AppDataSource: any;

  constructor(private queryRunner?: QueryRunner) {
    if (queryRunner) {
      this.repository = queryRunner.manager.getRepository(DefenseSubmission);
    } else {
      this.repository = AppDataSource.getRepository(DefenseSubmission);
    }

    this.AppDataSource = AppDataSource;
  }

  /**
   * CREATE n UPDATE n DELETE
   */

  /**
   * Create Defense Submission Documents
   * @param defenseSubmissionId - Defense Submission ID
   * @param documents - Array of documents { name, url, type, email, studentId? }
   * @returns Promise
   */
  async createDocuments(
    defenseSubmissionId: number,
    documents: Array<{
      name: string;
      url: string;
      type: "draft" | "ppt";
      email: string;
      studentId?: number;
    }>
  ): Promise<any> {
    if (!documents || documents.length === 0) {
      return null;
    }

    const docRepo = this.AppDataSource.getRepository(DefenseSubmissionDocument);

    const savedDocs = [];
    for (const doc of documents) {
      const newDoc = docRepo.create({
        name: doc.name,
        url: doc.url,
        type: doc.type,
        email: doc.email,
        defense_submission: { id: defenseSubmissionId },
        ...(doc.studentId && { student: { id: doc.studentId } }),
      });
      const saved = await docRepo.save(newDoc);
      savedDocs.push(saved);
    }

    return savedDocs;
  }

  /**
   * Create Defense Submission dengan automatic guidance count calculation
   * @param fpId - Final Project ID
   * @param lecturerId - Lecturer ID yang memproses
   * @param defense_type - Tipe sidang (proposal, hasil, tutup)
   * @returns InsertResult
   */
  async createSubmission(
    fpId: number,
    lecturerId: number,
    expertiseGroup1Id: number,
    expertiseGroup2Id: number,
    defense_type: string
  ): Promise<any> {
    const qr = this.AppDataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      // 1. Hitung guidance sessions untuk supervisor 1 (status = 'completed')
      const guidanceSup1 = await qr.manager
        .createQueryBuilder()
        .from("guidance_sessions", "gs")
        .select("COUNT(*)", "count")
        .leftJoin("gs.final_project", "fp")
        .where("fp.id = :fpId", { fpId })
        .andWhere("gs.supervisor_type = :supervisor_type", {
          supervisor_type: 1,
        })
        .andWhere("gs.status = :status", { status: "completed" })
        .getRawOne();

      // 2. Hitung guidance sessions untuk supervisor 2 (status = 'completed')
      const guidanceSup2 = await qr.manager
        .createQueryBuilder()
        .from("guidance_sessions", "gs")
        .select("COUNT(*)", "count")
        .leftJoin("gs.final_project", "fp")
        .where("fp.id = :fpId", { fpId })
        .andWhere("gs.supervisor_type = :supervisor_type", {
          supervisor_type: 2,
        })
        .andWhere("gs.status = :status", { status: "completed" })
        .getRawOne();

      const guidance_sup_1_count = parseInt(guidanceSup1?.count || 0);
      const guidance_sup_2_count = parseInt(guidanceSup2?.count || 0);

      // 3. Insert ke defense_submissions
      const newSubmission = await qr.manager.insert(DefenseSubmission, {
        defense_type,
        status: "pending",
        guidance_sup_1_count,
        guidance_sup_2_count,
        final_project: { id: fpId },
        lecturer: { id: lecturerId },
        expertises_group_1: { id: expertiseGroup1Id },
        expertises_group_2: { id: expertiseGroup2Id },
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

  async approvalSubmission(data: any): Promise<any> {
    const qr = this.AppDataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      await qr.manager.update(DefenseSubmission, parseInt(data.id), {
        status: data.status,
        rejection_notes: data.rejection_notes || null,
      });

      await qr.commitTransaction();
    } catch (error) {
      await qr.rollbackTransaction();
      throw error;
    } finally {
      await qr.release();
    }
  }

  /**
   * FIND
   */

  /**
   * Find defense submission by ID with all relations
   * @param id - Defense Submission ID
   * @returns DefenseSubmission with relations
   */
  async findById(id: number): Promise<any> {
    return this.repository
      .createQueryBuilder("ds")
      .leftJoinAndSelect("ds.final_project", "fp")
      .leftJoinAndSelect("fp.supervisor_1", "supervisor_1")
      .leftJoinAndSelect("fp.supervisor_2", "supervisor_2")
      .leftJoinAndSelect("ds.examiner_1", "examiner_1")
      .leftJoinAndSelect("ds.examiner_2", "examiner_2")
      .leftJoinAndSelect("ds.lecturer", "lecturer")
      .leftJoinAndSelect("lecturer.user", "lecturerUser")
      .leftJoinAndSelect("ds.documents", "documents")
      .where("ds.id = :id", { id })
      .getOne();
  }

  /**
   * Find all defense submissions for a final project
   * @param fpId - Final Project ID
   * @returns Array of DefenseSubmission
   */
  async findByFinalProjectId(fpId: number): Promise<any> {
    return this.repository
      .createQueryBuilder("ds")
      .leftJoinAndSelect("ds.lecturer", "lecturer")
      .leftJoinAndSelect("lecturer.user", "lecturerUser")
      .leftJoinAndSelect("ds.documents", "documents")
      .where("ds.final_project.id = :fpId", { fpId })
      .orderBy("ds.created_at", "DESC")
      .getMany();
  }

  /**
   * Find defense submission by final project and defense type
   * @param fpId - Final Project ID
   * @param defense_type - Type of defense (proposal, hasil, tutup)
   * @returns DefenseSubmission or null
   */
  async findByFinalProjectAndType(
    fpId: number,
    defense_type: string
  ): Promise<any> {
    return this.repository
      .createQueryBuilder("ds")
      .leftJoinAndSelect("ds.final_project", "fp")
      .leftJoinAndSelect("ds.lecturer", "lecturer")
      .leftJoinAndSelect("lecturer.user", "lecturerUser")
      .leftJoinAndSelect("ds.examiner_1", "examiner1")
      .leftJoinAndSelect("examiner1.user", "examiner1User")
      .leftJoinAndSelect("ds.examiner_2", "examiner2")
      .leftJoinAndSelect("examiner2.user", "examiner2User")
      .leftJoinAndSelect("ds.documents", "documents")
      .where("fp.id = :fpId", { fpId })
      .andWhere("ds.defense_type = :defense_type", { defense_type })
      .getOne();
  }

  /**
   * Get guidance count for a specific supervisor and final project
   * @param fpId - Final Project ID
   * @param supervisorType - 1 or 2
   * @returns number
   */
  async getGuidanceCount(
    fpId: number,
    supervisorType: number
  ): Promise<number> {
    const result = await AppDataSource.createQueryBuilder()
      .from("guidance_sessions", "gs")
      .select("COUNT(*)", "count")
      .leftJoin("gs.final_project", "fp")
      .where("fp.id = :fpId", { fpId })
      .andWhere("gs.supervisor_type = :supervisor_type", {
        supervisor_type: supervisorType,
      })
      .andWhere("gs.status = :status", { status: "completed" })
      .getRawOne();

    return parseInt(result?.count || 0);
  }

  /**
   * Find all defense submissions by lecturer ID with all relations
   * @param lecturerId - Lecturer ID
   * @returns Array of DefenseSubmission with relations
   */
  /**
   * Find defense submissions where lecturer is supervisor atau examiner
   * @param lecturerId - ID lecturer (bisa sebagai pembimbing 1, pembimbing 2, penguji 1, atau penguji 2)
   * @returns Array of defense submissions yang lecturer-nya terlibat
   */
  async findByLecturerId(lecturerId: number): Promise<any> {
    return this.repository
      .createQueryBuilder("ds")
      .leftJoinAndSelect("ds.final_project", "fp")
      .leftJoinAndSelect("fp.members", "members")
      .leftJoinAndSelect("members.student", "student")
      .leftJoinAndSelect("student.user", "studentUser")
      .leftJoinAndSelect("fp.supervisor_1", "supervisor_1")
      .leftJoinAndSelect("supervisor_1.user", "supervisor_1_user")
      .leftJoinAndSelect("fp.supervisor_2", "supervisor_2")
      .leftJoinAndSelect("supervisor_2.user", "supervisor_2_user")
      .leftJoinAndSelect("ds.examiner_1", "examiner_1")
      .leftJoinAndSelect("examiner_1.user", "examiner_1_user")
      .leftJoinAndSelect("ds.examiner_2", "examiner_2")
      .leftJoinAndSelect("examiner_2.user", "examiner_2_user")
      .leftJoinAndSelect("fp.expertises_group_1", "fpExpertise1")
      .leftJoinAndSelect("fp.expertises_group_2", "fpExpertise2")
      .leftJoinAndSelect("ds.expertises_group_1", "dsExpertise1")
      .leftJoinAndSelect("ds.expertises_group_2", "dsExpertise2")
      .leftJoinAndSelect("ds.documents", "documents")
      .leftJoinAndSelect("documents.student", "docStudent")
      .leftJoinAndSelect("ds.lecturer", "lecturer")
      .leftJoinAndSelect("lecturer.user", "lecturerUser")
      .where(
        "(fp.supervisor1Id = :lecturerId OR fp.supervisor2Id = :lecturerId OR ds.examiner1Id = :lecturerId OR ds.examiner2Id = :lecturerId)",
        { lecturerId }
      )
      .orderBy("ds.created_at", "DESC")
      .getMany();
  }


  /**
   * Get all defense submissions that don't have a schedule yet
   * @returns Array of defense submissions without schedule
   */
  async findUnscheduled(): Promise<any> {
    return this.repository
      .createQueryBuilder("ds")
      .leftJoinAndSelect("ds.examiner_1", "examiner_1")
      .leftJoinAndSelect("examiner_1.user", "examiner_1_user")
      .leftJoinAndSelect("ds.examiner_2", "examiner_2")
      .leftJoinAndSelect("examiner_2.user", "examiner_2_user")
      .leftJoinAndSelect("ds.final_project", "fp")
      .leftJoinAndSelect("fp.members", "fpm")
      .leftJoinAndSelect("fpm.student", "student")
      .leftJoinAndSelect("student.user", "user")
      .leftJoinAndSelect("fp.supervisor_1", "supervisor_1")
      .leftJoinAndSelect("supervisor_1.user", "supervisor_1_user")
      .leftJoinAndSelect("fp.supervisor_2", "supervisor_2")
      .leftJoinAndSelect("supervisor_2.user", "supervisor_2_user")
      .leftJoinAndSelect("ds.expertises_group_1", "eg1")
      .leftJoinAndSelect("ds.expertises_group_2", "eg2")
      .leftJoinAndSelect(
        (qb) =>
          qb
            .select("def_sch.defense_submission_id")
            .from("defense_schedules", "def_sch"),
        "scheduled_defense",
        "scheduled_defense.defense_submission_id = ds.id"
      )
      .where("scheduled_defense.defense_submission_id IS NULL")
      .orderBy("ds.created_at", "ASC")
      .getMany();
  }

  /**
   * Update defense submission with examiners and defense date
   * @param id - Defense submission ID
   * @param data - Data to update (examiner_1, examiner_2, defense_date, capstone_code)
   * @returns UpdateResult
   */
  async updateDefenseSchedule(id: number, data: any): Promise<any> {
    const updateData: any = {};

    if (data.examiner_1_id) {
      updateData.examiner_1 = { id: data.examiner_1_id };
    }

    if (data.examiner_2_id) {
      updateData.examiner_2 = { id: data.examiner_2_id };
    }

    if (data.defense_date) {
      updateData.defense_date = data.defense_date;
    }

    if (data.capstone_code) {
      updateData.capstone_code = data.capstone_code;
    }

    return this.repository.update(id, updateData);
  }
}

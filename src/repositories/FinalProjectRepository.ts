import { Repository, QueryRunner } from "typeorm";
import AppDataSource from "../config/database";
import { LecturerRepository } from "./LecturerRepository";
import { FinalProjectPeriodsRepository } from "./FinalProjectPeriodsRepository";
import { FinalProjects, FinalProjectMembers } from "@/entities/finalProject";
import { Lecturer } from "@/entities/lecturer";
import { FinalProjectData, FPChangeSupervisorRequest } from "@/types/student";
import fileUploadUtil from "@/utils/fileUpload";
import { FPApprovalRequest } from "@/types/lecturer";

export class FinalProjectRepository {
  public repository: Repository<FinalProjects>;
  public memberRepository: Repository<FinalProjectMembers>;
  public lecturerRepository: Repository<Lecturer>;
  public lcRepo: LecturerRepository;
  public fppRepo: FinalProjectPeriodsRepository;

  public AppDataSource: any;

  constructor(private queryRunner?: QueryRunner) {
    if (queryRunner) {
      this.repository = queryRunner.manager.getRepository(FinalProjects);
      this.memberRepository =
        queryRunner.manager.getRepository(FinalProjectMembers);
      this.lecturerRepository = queryRunner.manager.getRepository(Lecturer);
      this.lcRepo = new LecturerRepository(queryRunner);
      this.fppRepo = new FinalProjectPeriodsRepository(queryRunner);
    } else {
      this.repository = AppDataSource.getRepository(FinalProjects);
      this.memberRepository = AppDataSource.getRepository(FinalProjectMembers);
      this.lecturerRepository = AppDataSource.getRepository(Lecturer);
      this.lcRepo = new LecturerRepository();
      this.fppRepo = new FinalProjectPeriodsRepository();
    }

    this.AppDataSource = AppDataSource;
  }

  async syncAdminStatus(): Promise<any> {
    const qr = AppDataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      await this.repository
        .createQueryBuilder()
        .update(FinalProjects)
        .set({ admin_status: "approved" })
        .where(
          "supervisor_1_status = :status1 AND supervisor_2_status = :status2",
          { status1: "approved", status2: "approved" }
        )
        .execute();

      await this.repository
        .createQueryBuilder()
        .update(FinalProjects)
        .set({ admin_status: "rejected" })
        .where(
          "supervisor_1_status = :status1 OR supervisor_2_status = :status2",
          { status1: "rejected", status2: "rejected" }
        )
        .execute();

      await qr.commitTransaction();
    } catch (error) {
      await qr.rollbackTransaction();
      throw error;
    } finally {
      await qr.release();
    }
  }

  async syncSup2StatusIfNull(): Promise<any> {
    const qr = AppDataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      await this.repository
        .createQueryBuilder()
        .update(FinalProjects)
        .set({
          supervisor_2_status: () =>
            `CASE WHEN supervisor2Id IS NULL THEN supervisor_1_status ELSE supervisor_2_status END`,
        })
        .execute();

      await qr.commitTransaction();
    } catch (error) {
      await qr.rollbackTransaction();
      throw error;
    } finally {
      await qr.release();
    }
  }

  /**
   * Mahasiswa
   *
   * @returns
   */

  async createWithFinalProjectMember(
    finalProjectData: any,
    finalProjectMemberData: Partial<FinalProjectData>[]
  ): Promise<any> {
    const id = await AppDataSource.manager.transaction(async (manager) => {
      // Create dan save final project terlebih dahulu
      const newData = manager.create(FinalProjects, {
        ...finalProjectData,
        final_project_period: { id: finalProjectData.finalProjectPeriodId },
        supervisor_1: { id: finalProjectData.supervisor1Id },
        supervisor_2: finalProjectData.supervisor2Id
          ? { id: finalProjectData.supervisor2Id }
          : null,
      });
      const savedFinalProject = await manager.save(newData);

      if (savedFinalProject) {
        for (const memberData of finalProjectMemberData) {
          // Simpan file draft_path, draft_filename, draft_size, jika ada
          let draftPath = "";
          let draftFilename = "";
          let draftSize = "";
          if (
            memberData.draft_path &&
            typeof memberData.draft_path === "object" &&
            "buffer" in memberData.draft_path
          ) {
            try {
              draftFilename = fileUploadUtil.sanitizeFilename(
                memberData.draft_path.originalname
              );
              draftSize = fileUploadUtil
                .bytesToMB(memberData.draft_path.size)
                .toString();

              draftPath = await fileUploadUtil.saveFile(
                memberData.draft_path,
                "final-projects/drafts"
              );
            } catch (error) {
              throw new Error(
                `Failed to save draft file: ${
                  error instanceof Error ? error.message : "Unknown error"
                }`
              );
            }
          }

          // Simpan file dispen_path,dispen_filename, dispen_size jika ada
          let dispenPath = "";
          let dispenFilename = "";
          let dispenSize = "";
          if (
            memberData.dispen_path &&
            typeof memberData.dispen_path === "object" &&
            "buffer" in memberData.dispen_path
          ) {
            try {
              dispenFilename = fileUploadUtil.sanitizeFilename(
                memberData.dispen_path.originalname
              );
              dispenSize = fileUploadUtil
                .bytesToMB(memberData.dispen_path.size)
                .toString();
              dispenPath = await fileUploadUtil.saveFile(
                memberData.dispen_path,
                "final-projects/dispen"
              );
            } catch (error) {
              throw new Error(
                `Failed to save dispen file: ${
                  error instanceof Error ? error.message : "Unknown error"
                }`
              );
            }
          }

          const newMemberData = {
            title: memberData.title,
            resume: memberData.resume,
            draft_path: draftPath,
            draft_filename: draftFilename,
            draft_size: draftSize,
            dispen_path: dispenPath,
            dispen_filename: dispenFilename,
            dispen_size: dispenSize,
          };
          const studentId = parseInt(memberData.studentId!);

          const member = manager.create(FinalProjectMembers, {
            ...newMemberData,
            final_project: savedFinalProject,
            student: { id: studentId },
          });
          await manager.save(member);
        }
      }

      return savedFinalProject.id;
    });

    return await this.findById(id);
  }

  async findById(id: number): Promise<FinalProjects | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ["supervisor_1", "supervisor_2", "members"],
    });
  }

  async findHistoryByUserId(studentId: number): Promise<any> {
    let result = null;

    const fp = await this.memberRepository
      .createQueryBuilder("fpm")
      .innerJoinAndSelect("fpm.final_project", "fp")
      .where("fpm.studentId = :studentId", { studentId })
      .select(["fpm.id", "fp.id"])
      .getOne();

    if (fp) {
      const fpId = fp.final_project.id;
      result = await this.repository
        .createQueryBuilder("fp")
        .innerJoinAndSelect("fp.members", "fpm")
        .innerJoinAndSelect("fp.supervisor_1", "sup1")
        .leftJoinAndSelect("fp.supervisor_2", "sup2") // left join karena bisa saja null
        .innerJoinAndSelect("sup1.user", "sup1User")
        .leftJoinAndSelect("sup2.user", "sup2User") // left join karena bisa saja null
        .innerJoinAndSelect("fpm.student", "fpmStu")
        .innerJoinAndSelect("fpmStu.user", "fpmStuUser")
        .where("fp.id = :fpId", { fpId })
        .getOne();
    }

    return result;
  }

  async changeSupervisor(data: FPChangeSupervisorRequest): Promise<any> {
    const { fpId, supervisor_1, supervisor_2 } = data;

    return await this.repository
      .createQueryBuilder()
      .update(FinalProjects)
      .set({
        admin_status: "pending",
        supervisor_1_status: () =>
          "CASE WHEN :supervisor_1 IS NOT NULL THEN 'pending' ELSE supervisor_1_status END",
        supervisor_2_status: () =>
          "CASE WHEN :supervisor_2 IS NOT NULL THEN 'pending' ELSE supervisor_2_status END",
        supervisor_1: () =>
          "CASE WHEN :supervisor_1 IS NOT NULL THEN :supervisor_1 ELSE supervisor1Id END",
        supervisor_2: () =>
          "CASE WHEN :supervisor_2 IS NOT NULL THEN :supervisor_2 ELSE supervisor2Id END",
      })
      .where("id = :fpId", { fpId })
      .setParameters({ supervisor_1, supervisor_2 })
      .execute();
  }

  async deleteFP(id: number): Promise<any> {
    try {
      const fp = await this.findById(id);
      if (!fp) {
        throw new Error("Final project not found");
      }

      for (const member of fp.members) {
        await fileUploadUtil.deleteFile(member.draft_path);

        if (member.dispen_path) {
          await fileUploadUtil.deleteFile(member.dispen_path);
        }
      }

      await this.repository.delete(id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Dosen
   *
   * @returns
   */

  async findValidationStats(userId: number): Promise<any> {
    let result = null;

    // cek lc id ada dan periode tugas akhir valid
    const lc = await this.lcRepo.findByUserId(userId);
    if (!lc) {
      throw new Error("Dosen tidak ditemukan");
    }

    result = {
      remaining_quota_sup1: lc.max_supervised_1 - lc.current_supervised_1,
      remaining_quota_sup2: lc.max_supervised_2 - lc.current_supervised_2,
      max_quota_sup1: lc.max_supervised_1,
      max_quota_sup2: lc.max_supervised_2,
      filled_quota_sup1: lc.current_supervised_1,
      filled_quota_sup2: lc.current_supervised_2,
    };

    return result;
  }

  async findValidationData(userId: number): Promise<any> {
    let result = null;

    // search lecturer
    const lc = await this.lcRepo.findByUserId(userId);

    if (!lc) {
      throw new Error("Dosen tidak ditemukan");
    }

    // search data
    result = await this.repository
      .createQueryBuilder("fp")
      .innerJoinAndSelect("fp.members", "fpm")
      .innerJoinAndSelect("fp.supervisor_1", "sup1")
      .leftJoinAndSelect("fp.supervisor_2", "sup2") // left join karena bisa saja null
      .innerJoinAndSelect("sup1.user", "sup1User")
      .leftJoinAndSelect("sup2.user", "sup2User") // left join karena bisa saja null
      .innerJoinAndSelect("fpm.student", "fpmStu")
      .innerJoinAndSelect("fpmStu.user", "fpmStuUser")
      .where("fp.supervisor1Id = :lecturerId", { lecturerId: lc.id })
      .orWhere("fp.supervisor2Id = :lecturerId", { lecturerId: lc.id })
      .select([
        // fp
        "fp.id",
        "fp.created_at",
        "fp.type",
        "fp.status",
        "fp.source_topic",
        "fp.supervisor_1_status",
        "fp.supervisor_2_status",

        // sup
        "sup1.id",
        "sup1.max_supervised_1",
        "sup1.max_supervised_2",
        "sup2.id",
        "sup2.max_supervised_1",
        "sup2.max_supervised_2",
        "sup1User.id",
        "sup1User.name",
        "sup2User.id",
        "sup2User.name",

        // members
        "fpm.id",
        "fpm.title",
        "fpm.resume",
        "fpm.draft_path",
        "fpm.draft_filename",
        "fpm.draft_size",
        "fpm.dispen_path",
        "fpm.dispen_filename",
        "fpm.dispen_size",
        "fpm.created_at",
        "fpmStu.id",
        "fpmStu.nim",
        "fpmStuUser.name",
      ])
      .getMany();

    return result;
  }

  async approval(data: FPApprovalRequest): Promise<any> {
    const qr = AppDataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    const { fpId, status, supervisor_choices, note } = data;

    try {
      const fp = await this.findById(fpId);

      let lcData: { id?: number; choices: string } = { id: 0, choices: "" };

      // kurangi kuota dosen bimbingan jika status approved
      if (status === "approved") {
        if (supervisor_choices === "1") {
          lcData = { id: fp?.supervisor_1.id, choices: "1" };
        } else if (supervisor_choices === "2") {
          lcData = { id: fp?.supervisor_2?.id, choices: "2" };
        }
      }

      // kurangi kuota dosen bimbingan dahulu
      const result = await this.lcRepo.onFPAproval(lcData);
      const { error } = result;

      if (error) {
        return { error: error };
      }

      // ganti status sesuai pilihan dosen pembimbing 1 atau 2
      if (supervisor_choices === "1") {
        await this.repository
          .createQueryBuilder()
          .update(FinalProjects)
          .set({
            supervisor_1_status: status,
            supervisor_1_note: note ? note : "",
          })
          .where("id = :fpId", { fpId })
          .execute();
      } else if (supervisor_choices === "2") {
        await this.repository
          .createQueryBuilder()
          .update(FinalProjects)
          .set({
            supervisor_2_status: status,
            supervisor_2_note: note ? note : "",
          })
          .where("id = :fpId", { fpId })
          .execute();
      }

      await qr.commitTransaction();
    } catch (error) {
      await qr.rollbackTransaction();
      throw error;
    } finally {
      await qr.release();
    }

    try {
      // sinkronisasi jika sup2 NULL akan disamakan dengan sup1 status
      await this.syncSup2StatusIfNull();

      // sinkronisasi admin status
      await this.syncAdminStatus();
    } catch (error) {
      throw error;
    }

    return { error: null };
  }

  /**
   * Admin
   *
   * @returns
   */
  async getDosen(): Promise<any> {
    try {
      const result = await this.lecturerRepository
        .createQueryBuilder("lc")
        .innerJoinAndSelect("lc.user", "lcUser")
        .getMany();

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update final project with specific fields
   * @param fpId - Final Project ID
   * @param data - Data to update
   * @returns Update result
   */
  async updateFinalProject(
    fpId: number,
    data: Partial<FinalProjects>
  ): Promise<any> {
    try {
      const result = await this.repository
        .createQueryBuilder()
        .update(FinalProjects)
        .set(data)
        .where("id = :fpId", { fpId })
        .execute();

      return result;
    } catch (error) {
      throw error;
    }
  }

  async getPengajuan(): Promise<any> {
    try {
      const result = await this.repository
        .createQueryBuilder("fp")
        .innerJoinAndSelect("fp.members", "fpm")
        .innerJoinAndSelect("fp.supervisor_1", "sup1")
        .leftJoinAndSelect("fp.supervisor_2", "sup2") // left join karena bisa saja null
        .innerJoinAndSelect("sup1.user", "sup1User")
        .leftJoinAndSelect("sup2.user", "sup2User") // left join karena bisa saja null
        .innerJoinAndSelect("fpm.student", "fpmStu")
        .innerJoinAndSelect("fpmStu.user", "fpmStuUser")
        .getMany();

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all approved defense submissions for CSV export
   * @param defense_type - Type of defense (proposal, hasil) - optional
   * @returns Array of defense submissions with all relations needed for CSV
   */
  async findForCsvExport(defense_type?: string): Promise<any> {
    const query = this.repository
      .createQueryBuilder("fp")
      .leftJoinAndSelect("fp.defense_submissions", "ds")
      .leftJoinAndSelect("fp.members", "members")
      .leftJoinAndSelect("members.student", "student")
      .leftJoinAndSelect("student.user", "studentUser")
      .leftJoinAndSelect("fp.supervisor_1", "supervisor1")
      .leftJoinAndSelect("supervisor1.user", "supervisor1User")
      .leftJoinAndSelect("fp.supervisor_2", "supervisor2")
      .leftJoinAndSelect("supervisor2.user", "supervisor2User")
      .leftJoinAndSelect("ds.examiner_1", "examiner1")
      .leftJoinAndSelect("examiner1.user", "examiner1User")
      .leftJoinAndSelect("ds.examiner_2", "examiner2")
      .leftJoinAndSelect("examiner2.user", "examiner2User")
      .leftJoinAndSelect("ds.expertises_group_1", "expertise1")
      .leftJoinAndSelect("ds.expertises_group_2", "expertise2")
      .where("ds.status = :status", { status: "approved" });

    if (defense_type) {
      query.andWhere("ds.defense_type = :defense_type", { defense_type });
    }

    return query.orderBy("ds.created_at", "ASC").getMany();
  }
}

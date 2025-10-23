import { Repository, QueryRunner } from "typeorm";
import AppDataSource from "../config/database";
import { LecturerRepository } from "./LecturerRepository";
import { FinalProjectPeriodsRepository } from "./FinalProjectPeriodsRepository";
import { FinalProjects, FinalProjectMembers } from "@/entities/finalProject";
import { FinalProjectData } from "@/types/mahasiswa";
import fileUploadUtil from "@/utils/fileUpload";
import { parse } from "path";

export class FinalProjectRepository {
  public repository: Repository<FinalProjects>;
  public memberRepository: Repository<FinalProjectMembers>;
  public lecturerRepository: LecturerRepository;
  public fppRepository: FinalProjectPeriodsRepository;
  public qr: any;

  constructor(private queryRunner?: QueryRunner) {
    if (queryRunner) {
      this.repository = queryRunner.manager.getRepository(FinalProjects);
      this.memberRepository =
        queryRunner.manager.getRepository(FinalProjectMembers);
      this.lecturerRepository = new LecturerRepository(queryRunner);
      this.fppRepository = new FinalProjectPeriodsRepository(queryRunner);
    } else {
      this.repository = AppDataSource.getRepository(FinalProjects);
      this.memberRepository = AppDataSource.getRepository(FinalProjectMembers);
      this.lecturerRepository = new LecturerRepository();
      this.fppRepository = new FinalProjectPeriodsRepository();
    }

    this.qr = AppDataSource.createQueryRunner();
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
        .select([
          "fp.id",
          "fp.created_at",
          "fp.type",
          "fp.status",
          "fp.source_topic",
          "fp.admin_status",
          "sup1.id",
          "sup2.id",
          "sup1User.name",
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
        .getOne();
    }

    return result;
  }

  /**
   * Dosen
   *
   * @returns
   */

  async checkPeriod(userId: number): Promise<any> {
    // search lecturer
    const lc = await this.lecturerRepository.findByUserId(userId);

    if (!lc) {
      return null;
    }

    // cek apakah masuk periode tugas akhir
    const fp = await this.repository
      .createQueryBuilder("fp")
      .innerJoinAndSelect("fp.final_project_period", "fpp")
      .where(
        "fp.supervisor1Id = :lecturerId OR fp.supervisor2Id = :lecturerId",
        { lecturerId: lc.id }
      )
      .getOne();

    if (!fp) {
      return null;
    }

    const period = await this.fppRepository.findById(
      fp.final_project_period.id
    );

    if (!period) {
      return null;
    }

    // cek apakah sekarang dalam rentang start_date dan end_date
    const currentDate = new Date().toISOString().split("T")[0];
    if (!(period.start_date <= currentDate && currentDate <= period.end_date)) {
      return null;
    }

    // returning lc.id jika peride valid
    return lc;
  }

  async findValidationStats(userId: number): Promise<any> {
    let result = null;

    // cek lc id ada dan periode tugas akhir valid
    const lc = await this.checkPeriod(userId);
    if (!lc) {
      return null;
    }

    const sup1 = await this.repository
      .createQueryBuilder("fp")
      .where("fp.supervisor1Id = :lecturerId", { lecturerId: lc.id })
      .andWhere("fp.supervisor_1_status = :status", { status: "approved" })
      .getCount();

    const sup2 = await this.repository
      .createQueryBuilder("fp")
      .where("fp.supervisor2Id = :lecturerId", { lecturerId: lc.id })
      .andWhere("fp.supervisor_2_status = :status", { status: "approved" })
      .getCount();

    result = {
      remaining_quota_sup1: lc.max_supervised_1 - sup1,
      remaining_quota_sup2: lc.max_supervised_2 - sup2,
      max_quota_sup1: lc.max_supervised_1,
      max_quota_sup2: lc.max_supervised_2,
      filled_quota_sup1: sup1,
      filled_quota_sup2: sup2,
    };

    return result;
  }

  async findValidationData(userId: number): Promise<any> {
    let result = null;

    // cek lc id ada dan periode tugas akhir valid
    const lc = await this.checkPeriod(userId);

    if (!lc) {
      return null;
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
}

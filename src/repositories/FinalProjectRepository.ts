import { Repository, QueryRunner } from "typeorm";
import AppDataSource from "../config/database";
import { FinalProjects, FinalProjectMembers } from "@/entities/finalProject";
import { FinalProjectData } from "@/types/mahasiswa";
import { title } from "process";
import fileUploadUtil from "@/utils/fileUpload";

export class FinalProjectRepository {
  public repository: Repository<FinalProjects>;
  public qr: any;

  constructor(private queryRunner?: QueryRunner) {
    if (queryRunner) {
      this.repository = queryRunner.manager.getRepository(FinalProjects);
    } else {
      this.repository = AppDataSource.getRepository(FinalProjects);
    }

    this.qr = AppDataSource.createQueryRunner();
  }

  /**
   * CREATE
   *
   * @returns
   */

  async createWithFinalProjectMember(
    finalProjectData: Partial<FinalProjects>,
    finalProjectMemberData: FinalProjectData[]
  ): Promise<any> {
    const id = await AppDataSource.manager.transaction(async (manager) => {
      // Create dan save final project terlebih dahulu
      const newData = manager.create(FinalProjects, finalProjectData);
      const savedFinalProject = await manager.save(newData);

      if (savedFinalProject) {
        //  simpan final project member
        for (const memberData of finalProjectMemberData) {
          // Simpan file draft_path jika ada
          let draftPath = "";
          if (
            memberData.draft_path &&
            typeof memberData.draft_path === "object" &&
            "buffer" in memberData.draft_path
          ) {
            try {
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

          // Simpan file dispen_path jika ada
          let dispenPath = "";
          if (
            memberData.dispen_path &&
            typeof memberData.dispen_path === "object" &&
            "buffer" in memberData.dispen_path
          ) {
            try {
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
            dispen_path: dispenPath,
          };

          const member = manager.create(FinalProjectMembers, {
            ...newMemberData,
            final_project: savedFinalProject,
            student: memberData.student.id,
          });
          await manager.save(member);
        }
      }

      return savedFinalProject.id;
    });

    return await this.findById(id);
  }

  /**
   * FIND
   *
   * @returns
   */
  async findById(id: number): Promise<FinalProjects | null> {
    return await this.repository.findOne({
      where: { id },
    });
  }
}

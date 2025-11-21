import { Repository, QueryRunner } from "typeorm";
import AppDataSource from "../config/database";
import { FinalProjectMembers } from "@/entities/finalProject";
import { FPAddSlotRequest } from "@/types/lecturer";

export class FinalProjectMemberRepository {
  public repository: Repository<FinalProjectMembers>;

  public AppDataSource: any;

  constructor(private queryRunner?: QueryRunner) {
    if (queryRunner) {
      this.repository = queryRunner.manager.getRepository(FinalProjectMembers);
    } else {
      this.repository = AppDataSource.getRepository(FinalProjectMembers);
    }

    this.AppDataSource = AppDataSource;
  }

  /**
   * CREATE n UPDATE
   *
   * @returns
   */

  /**
   * FIND
   *
   * @returns
   */
  async findByStudentIdWithFP(
    studentId: number
  ): Promise<FinalProjectMembers | null> {
    return this.repository.findOne({
      where: { student: { id: studentId } },
      relations: ["final_project"],
    });
  }

  async findByIdWithSupervisors(
    id: number
  ): Promise<FinalProjectMembers | null> {
    return this.repository
      .createQueryBuilder("fpm")
      .leftJoinAndSelect("fpm.final_project", "fp")
      .leftJoinAndSelect("fp.supervisor_1", "sup1")
      .leftJoinAndSelect("sup1.user", "user1")
      .leftJoinAndSelect("fp.supervisor_2", "sup2")
      .leftJoinAndSelect("sup2.user", "user2")
      .where("fpm.id = :id", { id })
      .getOne();
  }

  async findAllMembersByFinalProjectId(
    finalProjectId: number
  ): Promise<FinalProjectMembers[]> {
    return this.repository
      .createQueryBuilder("fpm")
      .leftJoinAndSelect("fpm.student", "student")
      .leftJoinAndSelect("student.user", "user")
      .where("fpm.final_project.id = :finalProjectId", { finalProjectId })
      .getMany();
  }

  async findAllMembersByStudentUserId(userId: number): Promise<any[]> {
    return this.repository
      .createQueryBuilder("fpm")
      .leftJoinAndSelect("fpm.student", "student")
      .leftJoinAndSelect("student.user", "user")
      .leftJoinAndSelect("fpm.final_project", "fp")
      .where("student.user.id = :userId", { userId })
      .getMany();
  }
}

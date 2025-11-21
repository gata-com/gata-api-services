import { Repository, QueryRunner } from "typeorm";
import AppDataSource from "../config/database";
import { DefenseSubmissionDocument } from "@/entities/defenses";

export class DefenseSubmissionRepository {
  public repository: Repository<DefenseSubmissionDocument>;
  public AppDataSource: any;

  constructor(private queryRunner?: QueryRunner) {
    if (queryRunner) {
      this.repository = queryRunner.manager.getRepository(
        DefenseSubmissionDocument
      );
    } else {
      this.repository = AppDataSource.getRepository(DefenseSubmissionDocument);
    }

    this.AppDataSource = AppDataSource;
  }

  /**
   *  CREATE n UPDATE
   *
   */

  /**
   * FIND
   *
   */

  async findByStudentId(studentId: number) {
    return this.repository
      .createQueryBuilder("dsd")
      .leftJoinAndSelect("dsd.student", "student")
      .where("student.id = :studentId", { studentId })
      .getMany();
  }
}

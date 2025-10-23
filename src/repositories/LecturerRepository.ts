import { Repository, QueryRunner } from "typeorm";
import AppDataSource from "../config/database";
import { Lecturer } from "@/entities/lecturer";

export class LecturerRepository {
  public repository: Repository<Lecturer>;

  public qr: any;

  constructor(private queryRunner?: QueryRunner) {
    if (queryRunner) {
      this.repository = queryRunner.manager.getRepository(Lecturer);
    } else {
      this.repository = AppDataSource.getRepository(Lecturer);
    }

    this.qr = AppDataSource.createQueryRunner();
  }

  /**
   * CREATE
   *
   * @returns
   */

  /**
   * FIND
   *
   * @returns
   */
  async findByUserId(userId: number): Promise<Lecturer | null> {
    return await this.repository
      .createQueryBuilder("lc")
      .where("lc.userId = :userId", { userId })
      .getOne();
  }
}

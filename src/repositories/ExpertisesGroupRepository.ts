import { Repository, QueryRunner } from "typeorm";
import AppDataSource from "../config/database";
import ExpertisesGroup from "@/entities/expertisesGroup";

export class ExpertisesGroupRepository {
  public repository: Repository<ExpertisesGroup>;

  public AppDataSource: any;

  constructor(private queryRunner?: QueryRunner) {
    if (queryRunner) {
      this.repository = queryRunner.manager.getRepository(ExpertisesGroup);
    } else {
      this.repository = AppDataSource.getRepository(ExpertisesGroup);
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
  async findAll(): Promise<ExpertisesGroup[]> {
    return this.repository.find();
  }

  /**
   * Find expertise group by ID
   */
  async findById(id: number): Promise<ExpertisesGroup | null> {
    return await this.repository.findOne({ where: { id } });
  }
}

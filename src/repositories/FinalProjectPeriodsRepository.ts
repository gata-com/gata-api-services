import {
  Repository,
  QueryRunner,
  LessThanOrEqual,
  FindOperator,
  MoreThanOrEqual,
} from "typeorm";
import AppDataSource from "../config/database";
import { FinalProjectPeriods } from "@/entities/finalProject";
import { FinalProjects } from "@/entities/finalProject";
import { Lecturer } from "@/entities/lecturer";

export function GreaterThanOrEqual<T>(value: T): FindOperator<T> {
  return MoreThanOrEqual(value);
}

export class FinalProjectPeriodsRepository {
  public repository: Repository<FinalProjectPeriods>;

  public AppDataSource: any;

  constructor(private queryRunner?: QueryRunner) {
    if (queryRunner) {
      this.repository = queryRunner.manager.getRepository(FinalProjectPeriods);
    } else {
      this.repository = AppDataSource.getRepository(FinalProjectPeriods);
    }
    this.AppDataSource = AppDataSource;
  }

  /**
   *
   * CREATE n UPDATE
   * @returns
   */

  async create(
    periodData: Partial<FinalProjectPeriods>
  ): Promise<FinalProjectPeriods> {
    const period = this.repository.create(periodData);
    return await this.repository.save(period);
  }

  async processRejectionOnPeriodEnd(): Promise<any> {
    const qr = this.AppDataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const lastFinishedPeriod = await this.findLastFinishedPeriod();
      if (!lastFinishedPeriod) {
        return;
      }

      const periodId = lastFinishedPeriod.id;

      const result = await this.repository
        .createQueryBuilder()
        .update(FinalProjects)
        .set({
          supervisor_1_status: () =>
            "CASE WHEN supervisor_1_status = 'pending' THEN 'rejected' ELSE supervisor_1_status END",
          supervisor_2_status: () =>
            "CASE WHEN supervisor_2_status = 'pending' THEN 'rejected' ELSE supervisor_2_status END",
        })
        .where("finalProjectPeriodId = :periodId", { periodId })
        .execute();

      await qr.commitTransaction();

      return result.affected ?? 0;
    } catch (error) {
      await qr.rollbackTransaction();
      console.error("❌ Error processing rejection on period end:", error);
    } finally {
      await qr.release();
    }
  }

  /**
   *
   * FIND
   * @returns
   */

  async findCurrentPeriodOverall(): Promise<FinalProjectPeriods | null> {
    // get current date in YYYY-MM-DD format
    const currentDate = new Date().toISOString().split("T")[0];
    return await this.repository.findOne({
      where: {
        start_date: LessThanOrEqual(currentDate),
        approval_end_date: GreaterThanOrEqual(currentDate),
      },
      order: { end_date: "DESC" },
    });
  }

  async findCurrentPeriodApproval(): Promise<FinalProjectPeriods | null> {
    // get current date in YYYY-MM-DD format
    const currentDate = new Date().toISOString().split("T")[0];
    return await this.repository.findOne({
      where: {
        end_date: LessThanOrEqual(currentDate),
        approval_end_date: GreaterThanOrEqual(currentDate),
      },
      order: { end_date: "DESC" },
    });
  }

  async findCurrentPeriod(): Promise<FinalProjectPeriods | null> {
    // get current date in YYYY-MM-DD format
    const currentDate = new Date().toISOString().split("T")[0];
    return await this.repository.findOne({
      where: {
        start_date: LessThanOrEqual(currentDate),
        end_date: GreaterThanOrEqual(currentDate),
      },
      order: { start_date: "DESC" },
    });
  }

  async findLastFinishedPeriod(): Promise<FinalProjectPeriods | null> {
    // get current date in YYYY-MM-DD format
    const currentDate = new Date().toISOString().split("T")[0];
    return await this.repository.findOne({
      where: {
        approval_end_date: LessThanOrEqual(currentDate),
      },
      order: { end_date: "DESC" },
    });
  }

  async findAll(): Promise<FinalProjectPeriods[]> {
    return await this.repository.find();
  }

  async findById(id: number): Promise<FinalProjectPeriods | null> {
    return await this.repository.findOneBy({ id });
  }
}

import { Repository, QueryRunner, LessThanOrEqual } from "typeorm";
import AppDataSource from "../config/database";
import { FinalProjectPeriods } from "@/entities/finalProject";
import { FindOperator, MoreThanOrEqual } from "typeorm";

export function GreaterThanOrEqual<T>(value: T): FindOperator<T> {
  return MoreThanOrEqual(value);
}

export class FinalProjectPeriodsRepository {
  public repository: Repository<FinalProjectPeriods>;
  public qr: any;

  constructor(private queryRunner?: QueryRunner) {
    if (queryRunner) {
      this.repository = queryRunner.manager.getRepository(FinalProjectPeriods);
    } else {
      this.repository = AppDataSource.getRepository(FinalProjectPeriods);
    }

    this.qr = AppDataSource.createQueryRunner();
  }

  async create(
    periodData: Partial<FinalProjectPeriods>
  ): Promise<FinalProjectPeriods> {
    const period = this.repository.create(periodData);
    return await this.repository.save(period);
  }

  async findCurrentPeriod(): Promise<FinalProjectPeriods | null> {
    // get current date in YYYY-MM-DD format
    const currentDate = new Date().toISOString().split("T")[0];
    return await this.repository.findOne({
      where: {
        start_date: LessThanOrEqual(currentDate),
        end_date: GreaterThanOrEqual(currentDate),
      },
    });
  }

  async findAll(): Promise<FinalProjectPeriods[]> {
    return await this.repository.find();
  }

  async findById(id: number): Promise<FinalProjectPeriods | null> {
    return await this.repository.findOneBy({ id });
  }
}

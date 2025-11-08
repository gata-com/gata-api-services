import { Repository, QueryRunner } from "typeorm";
import AppDataSource from "../config/database";
import { GuidanceAvailability } from "@/entities/guidance";
import { AvailabilityRequest } from "@/types/lecturer";

export class GuidanceAvailabilityRepository {
  public repository: Repository<GuidanceAvailability>;

  public AppDataSource: any;

  constructor(private queryRunner?: QueryRunner) {
    if (queryRunner) {
      this.repository = queryRunner.manager.getRepository(GuidanceAvailability);
    } else {
      this.repository = AppDataSource.getRepository(GuidanceAvailability);
    }

    this.AppDataSource = AppDataSource;
  }

  /**
   * CREATE n UPDATE n DELETE
   *
   * @returns
   */

  async saveAvailability(
    data: AvailabilityRequest,
    lcId: number
  ): Promise<any> {
    const qr = AppDataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const { id, day_of_week, start_time, end_time, location } = data;
      if (id) {
        // update
        await qr.manager.update(
          GuidanceAvailability,
          { id },
          {
            day_of_week,
            start_time,
            end_time,
            location,
          }
        );
      } else {
        // Add new
        await qr.manager.insert(GuidanceAvailability, {
          day_of_week,
          start_time,
          end_time,
          location,
          lecturer: { id: lcId },
        });
      }

      await qr.commitTransaction();

      return { error: null };
    } catch (error) {
      await qr.rollbackTransaction();
      throw error;
    } finally {
      await qr.release();
    }
  }

  async deleteById(id: number): Promise<any> {
    return await this.repository.delete({ id });
  }

  /**
   * FIND
   *
   * @returns
   */

  async findById(id: number): Promise<GuidanceAvailability | null> {
    return await this.repository.findOne({
      where: { id },
    });
  }

  async getAvailability(lcId: number): Promise<GuidanceAvailability[]> {
    return await this.repository.find({
      where: { lecturer: { id: lcId } },
    });
  }

  async findByLecturerId(lecturerId: number): Promise<GuidanceAvailability[]> {
    return await this.repository.find({
      where: { lecturer: { id: lecturerId } },
      order: { day_of_week: "ASC", start_time: "ASC" },
    });
  }
}

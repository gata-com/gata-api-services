import { Repository, QueryRunner } from "typeorm";
import AppDataSource from "../config/database";
import { Lecturer } from "@/entities/lecturer";
import { FPAddSlotRequest } from "@/types/lecturer";

export class LecturerRepository {
  public repository: Repository<Lecturer>;

  public AppDataSource: any;

  constructor(private queryRunner?: QueryRunner) {
    if (queryRunner) {
      this.repository = queryRunner.manager.getRepository(Lecturer);
    } else {
      this.repository = AppDataSource.getRepository(Lecturer);
    }

    this.AppDataSource = AppDataSource;
  }

  /**
   * CREATE n UPDATE
   *
   * @returns
   */

  async onFPAproval(data: any): Promise<any> {
    const qr = AppDataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const { id, choices } = data;
      const lc = await this.repository.findOne({ where: { id } });

      if (choices === "1") {
        if (lc) {
          const finalSum = lc.current_supervised_1 + 1;
          // cek apakah setelah ditambah melebihi max_supervised_1
          if (finalSum > lc.max_supervised_1) {
            return {
              error: {
                path: "server",
                msg: "Kuota pembimbing 1 telah penuh",
              },
            };
          }

          // proses update jika tadak melebihi max
          await this.repository
            .createQueryBuilder()
            .update(Lecturer)
            .set({
              current_supervised_1: finalSum,
            })
            .where("id = :id", { id })
            .execute();
        }
      } else if (choices === "2") {
        if (lc) {
          const finalSum = lc.current_supervised_2 + 1;
          // cek apakah setelah ditambah melebihi max_supervised_2
          if (finalSum > lc.max_supervised_2) {
            return {
              error: {
                path: "server",
                msg: "Kuota pembimbing 2 telah penuh",
              },
            };
          }
          // proses update jika tadak melebihi max
          await this.repository
            .createQueryBuilder()
            .update(Lecturer)
            .set({
              current_supervised_2: finalSum,
            })
            .where("id = :id", { id })
            .execute();
        }
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

  async addSlot(lcId: number, data: FPAddSlotRequest): Promise<any> {
    const qr = AppDataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const { userId, supervisorType, amount } = data;
      const lc = await this.repository
        .createQueryBuilder()
        .update(Lecturer)
        .set({
          ...(supervisorType === "1"
            ? {
                max_supervised_1: () => `max_supervised_1 + ${amount}`,
              }
            : {}),
          ...(supervisorType === "2"
            ? {
                max_supervised_2: () => `max_supervised_2 + ${amount}`,
              }
            : {}),
        })
        .where("id = :lcId", { lcId })
        .execute();

      await qr.commitTransaction();

      return lc;
    } catch (error) {
      await qr.rollbackTransaction();
      throw error;
    } finally {
      await qr.release();
    }
  }

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

  async findById(id: number): Promise<Lecturer | null> {
    return await this.repository.findOne({
      where: { id },
    });
  }

  async findAllWithGA(): Promise<any> {
    return this.repository
      .createQueryBuilder("lc")
      .innerJoinAndSelect("lc.guidance_availability", "ga")
      .getMany();
  }

  async findByNip(nip: string): Promise<Lecturer | null> {
    return await this.repository.findOne({
      where: { nip },
    });
  }

  /**
   * Find lecturer by name (from User table)
   * @param name - Lecturer name
   * @returns Lecturer or null
   */
  async findByName(name: string): Promise<any> {
    return this.repository
      .createQueryBuilder("lc")
      .leftJoinAndSelect("lc.user", "u")
      .where("u.name = :name", { name })
      .getOne();
  }

  /**
   * Get all lecturers with id and name for examiner/supervisor selection
   * @returns Array of lecturer with id and name
   */
  async findAllExaminers(): Promise<any> {
    return this.repository
      .createQueryBuilder("lc")
      .leftJoinAndSelect("lc.user", "u")
      .select("lc.id", "id")
      .addSelect("u.name", "name")
      .getRawMany();
  }

  async update(id: number, data: any): Promise<void> {
    await this.repository.update(id, data);
  }
}

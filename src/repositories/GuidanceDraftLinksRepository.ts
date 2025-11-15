import { Repository, QueryRunner } from "typeorm";
import AppDataSource from "../config/database";
import { GuidanceDraftLink } from "@/entities/guidance";
import {} from "@/types/student";

export class GuidanceDraftLinksRepository {
  public repository: Repository<GuidanceDraftLink>;

  public AppDataSource: any;

  constructor(private queryRunner?: QueryRunner) {
    if (queryRunner) {
      this.repository = queryRunner.manager.getRepository(GuidanceDraftLink);
    } else {
      this.repository = AppDataSource.getRepository(GuidanceDraftLink);
    }

    this.AppDataSource = AppDataSource;
  }

  /**
   * CREATE n UPDATE n DELETE
   *
   * @returns
   */
  async create(data: Partial<GuidanceDraftLink>, GAId: number): Promise<any> {
    const qr = AppDataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    const { name, url } = data;
    try {
      const newSubmission = await qr.manager.insert(GuidanceDraftLink, {
        name,
        url,
        guidance_session: { id: GAId },
      });
      await qr.commitTransaction();
      return newSubmission;
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
}

import { Repository, QueryRunner } from "typeorm";
import AppDataSource from "../config/database";
import { Signature } from "@/entities/signature";

export class SignatureRepository {
  public repository: Repository<Signature>;

  public AppDataSource: any;

  constructor(private queryRunner?: QueryRunner) {
    if (queryRunner) {
      this.repository = queryRunner.manager.getRepository(Signature);
    } else {
      this.repository = AppDataSource.getRepository(Signature);
    }

    this.AppDataSource = AppDataSource;
  }

  /**
   * CREATE & UPDATE
   */

  async create(data: Partial<Signature>): Promise<Signature> {
    const signature = this.repository.create(data);
    return await this.repository.save(signature);
  }

  async update(
    id: number,
    data: Partial<Signature>
  ): Promise<Signature | null> {
    await this.repository.update(id, data);
    return await this.findById(id);
  }

  /**
   * READ
   */

  async findById(id: number): Promise<Signature | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ["lecturer"],
    });
  }

  async findByLecturerId(lecturerId: number): Promise<Signature | null> {
    return await this.repository.findOne({
      where: { lecturer: { id: lecturerId } },
      relations: ["lecturer"],
    });
  }

  async findAll(): Promise<Signature[]> {
    return await this.repository.find({
      relations: ["lecturer"],
    });
  }

  /**
   * DELETE
   */

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== 0;
  }

  async deleteByLecturerId(lecturerId: number): Promise<boolean> {
    const result = await this.repository.delete({
      lecturer: { id: lecturerId },
    });
    return result.affected !== 0;
  }
}

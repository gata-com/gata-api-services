import AppDataSource from "../config/database";
import { OpsiJawaban } from "@/entities/opsiJawaban";
import { Repository } from "typeorm";

export class OpsiJawabanRepository {
  private repository: Repository<OpsiJawaban>;

  constructor() {
    this.repository = AppDataSource.getRepository(OpsiJawaban);
  }

  async findById(id: string): Promise<OpsiJawaban | null> {
    return await this.repository.findOne({ where: { id } });
  }

  async create(data: Partial<OpsiJawaban>): Promise<OpsiJawaban> {
    const opsi = this.repository.create(data);
    return await this.repository.save(opsi);
  }

  async update(
    id: string,
    data: Partial<OpsiJawaban>
  ): Promise<OpsiJawaban | null> {
    await this.repository.update(id, data);
    return await this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async bulkDelete(ids: string[]): Promise<void> {
    await this.repository.delete(ids);
  }
}

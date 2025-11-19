import AppDataSource from "@/config/database";
import { RubrikGroup } from "@/entities/rubrikGroup";
import { Repository } from "typeorm";

export class RubrikGroupRepository {
  private repository: Repository<RubrikGroup>;

  constructor() {
    this.repository = AppDataSource.getRepository(RubrikGroup);
  }

  async findById(id: string): Promise<RubrikGroup | null> {
    return await this.repository
      .createQueryBuilder("group")
      .leftJoinAndSelect("group.pertanyaans", "pertanyaans")
      .leftJoinAndSelect("pertanyaans.opsiJawabans", "opsiJawabans")
      .where("group.id = :id", { id })
      .orderBy("pertanyaans.urutan", "ASC")
      .addOrderBy("opsiJawabans.urutan", "ASC")
      .getOne();
  }

  async create(data: Partial<RubrikGroup>): Promise<RubrikGroup> {
    const group = this.repository.create(data);
    return await this.repository.save(group);
  }

  async update(
    id: string,
    data: Partial<RubrikGroup>
  ): Promise<RubrikGroup | null> {
    await this.repository.update(id, data);
    return await this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async reorder(rubrikId: string, groupIds: string[]): Promise<void> {
    for (let i = 0; i < groupIds.length; i++) {
      await this.repository.update(groupIds[i], { urutan: i + 1 });
    }
  }
}

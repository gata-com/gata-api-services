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

  async getDefaultByRubrik(rubrikId: string): Promise<RubrikGroup | null> {
    return await this.repository.findOne({
      where: {
        rubrikId,
        isDefault: true,
      },
    });
  }

  async setDefault(groupId: string): Promise<RubrikGroup | null> {
    // First, find the group to get its rubrikId
    const group = await this.findById(groupId);
    if (!group) return null;

    // Remove default from all other groups in the same rubrik
    await this.repository.update(
      { rubrikId: group.rubrikId, isDefault: true },
      { isDefault: false }
    );

    // Set this group as default
    return await this.update(groupId, { isDefault: true });
  }

  async unsetDefault(groupId: string): Promise<RubrikGroup | null> {
    return await this.update(groupId, { isDefault: false });
  }
}

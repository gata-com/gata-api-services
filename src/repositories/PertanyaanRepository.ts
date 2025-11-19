import AppDataSource from "@/config/database";
import { Pertanyaan } from "@/entities/pertanyaan";
import { Repository } from "typeorm";

export class PertanyaanRepository {
  private repository: Repository<Pertanyaan>;

  constructor() {
    this.repository = AppDataSource.getRepository(Pertanyaan);
  }

  async findById(id: string): Promise<Pertanyaan | null> {
    return await this.repository
      .createQueryBuilder("pertanyaan")
      .leftJoinAndSelect("pertanyaan.opsiJawabans", "opsiJawabans")
      .where("pertanyaan.id = :id", { id })
      .orderBy("opsiJawabans.urutan", "ASC")
      .getOne();
  }

  async create(data: Partial<Pertanyaan>): Promise<Pertanyaan> {
    const pertanyaan = this.repository.create(data);
    return await this.repository.save(pertanyaan);
  }

  async update(
    id: string,
    data: Partial<Pertanyaan>
  ): Promise<Pertanyaan | null> {
    await this.repository.update(id, data);
    return await this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async duplicate(id: string): Promise<Pertanyaan> {
    const original = await this.findById(id);
    if (!original) {
      throw new Error("Pertanyaan not found");
    }

    const duplicate = this.repository.create({
      groupId: original.groupId,
      text: original.text + " (Copy)",
      bobot: original.bobot,
      urutan: original.urutan + 1,
      opsiJawabans: original.opsiJawabans?.map((opsi) => ({
        text: opsi.text,
        nilai: opsi.nilai,
        urutan: opsi.urutan,
      })),
    });

    return await this.repository.save(duplicate);
  }

  async reorder(groupId: string, pertanyaanIds: string[]): Promise<void> {
    for (let i = 0; i < pertanyaanIds.length; i++) {
      await this.repository.update(pertanyaanIds[i], { urutan: i + 1 });
    }
  }
}

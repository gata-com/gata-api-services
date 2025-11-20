import AppDataSource from "@/config/database";
import { Rubrik } from "@/entities/rubrik";
import { Repository } from "typeorm";

export class RubrikRepository {
  private repository: Repository<Rubrik>;

  constructor() {
    this.repository = AppDataSource.getRepository(Rubrik);
  }

  async findAll(type?: "SID" | "SEM"): Promise<Rubrik[]> {
    const query = this.repository
      .createQueryBuilder("rubrik")
      .leftJoinAndSelect("rubrik.groups", "groups")
      .leftJoinAndSelect("groups.pertanyaans", "pertanyaans")
      .leftJoinAndSelect("pertanyaans.opsiJawabans", "opsiJawabans")
      .where("rubrik.isActive = :isActive", { isActive: true })
      .orderBy("rubrik.createdAt", "DESC")
      .addOrderBy("groups.urutan", "ASC")
      .addOrderBy("pertanyaans.urutan", "ASC")
      .addOrderBy("opsiJawabans.urutan", "ASC");

    if (type) {
      query.andWhere("rubrik.type = :type", { type });
    }

    return await query.getMany();
  }

  async findById(id: string): Promise<Rubrik | null> {
    return await this.repository
      .createQueryBuilder("rubrik")
      .leftJoinAndSelect("rubrik.groups", "groups")
      .leftJoinAndSelect("groups.pertanyaans", "pertanyaans")
      .leftJoinAndSelect("pertanyaans.opsiJawabans", "opsiJawabans")
      .where("rubrik.id = :id", { id })
      .orderBy("groups.urutan", "ASC")
      .addOrderBy("pertanyaans.urutan", "ASC")
      .addOrderBy("opsiJawabans.urutan", "ASC")
      .getOne();
  }

  async findDefaultByType(type: "SID" | "SEM"): Promise<Rubrik | null> {
    return await this.repository
      .createQueryBuilder("rubrik")
      .leftJoinAndSelect("rubrik.groups", "groups")
      .leftJoinAndSelect("groups.pertanyaans", "pertanyaans")
      .leftJoinAndSelect("pertanyaans.opsiJawabans", "opsiJawabans")
      .where("rubrik.type = :type", { type })
      .andWhere("rubrik.isDefault = :isDefault", { isDefault: true })
      .andWhere("rubrik.isActive = :isActive", { isActive: true })
      .orderBy("groups.urutan", "ASC")
      .addOrderBy("pertanyaans.urutan", "ASC")
      .addOrderBy("opsiJawabans.urutan", "ASC")
      .getOne();
  }

  async create(data: Partial<Rubrik>): Promise<Rubrik> {
    const rubrik = this.repository.create(data);
    return await this.repository.save(rubrik);
  }

  async update(id: string, data: Partial<Rubrik>): Promise<Rubrik | null> {
    await this.repository.update(id, data);
    return await this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async setDefault(id: string, type: "SID" | "SEM"): Promise<void> {
    // Unset all default for this type
    const res = await this.repository.update(
      { type, isDefault: true },
      { isDefault: false }
    );

    console.log(`Unset ${res.affected} default rubrik(s) of type ${type}`);

    // Set new default
    await this.repository.update(id, { isDefault: true });
  }

  async duplicate(id: string, newName: string): Promise<Rubrik> {
    const original = await this.findById(id);
    if (!original) {
      throw new Error("Rubrik not found");
    }

    const duplicate = this.repository.create({
      nama: newName,
      deskripsi: original.deskripsi,
      type: original.type,
      isDefault: false,
      groups: original.groups?.map((group) => ({
        nama: group.nama,
        bobotTotal: group.bobotTotal,
        urutan: group.urutan,
        pertanyaans: group.pertanyaans?.map((pertanyaan) => ({
          text: pertanyaan.text,
          bobot: pertanyaan.bobot,
          urutan: pertanyaan.urutan,
          opsiJawabans: pertanyaan.opsiJawabans?.map((opsi: any) => ({
            text: opsi.text,
            nilai: opsi.nilai,
            urutan: opsi.urutan,
          })),
        })),
      })),
    });

    return await this.repository.save(duplicate);
  }
}

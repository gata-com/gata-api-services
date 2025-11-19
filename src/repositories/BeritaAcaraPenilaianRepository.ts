import AppDataSource from "@/config/database";
import { BeritaAcaraPenilaian } from "@/entities/beritaAcaraPenilaian";
import { Repository } from "typeorm";

export class BeritaAcaraPenilaianRepository {
  private repository: Repository<BeritaAcaraPenilaian>;

  constructor() {
    this.repository = AppDataSource.getRepository(BeritaAcaraPenilaian);
  }

  async findByJadwalId(jadwalId: number): Promise<BeritaAcaraPenilaian | null> {
    return await this.repository
      .createQueryBuilder("bap")
      .leftJoinAndSelect("bap.jadwal", "jadwal")
      .where("bap.jadwalId = :jadwalId", { jadwalId })
      .getOne();
  }

  async create(
    data: Partial<BeritaAcaraPenilaian>
  ): Promise<BeritaAcaraPenilaian> {
    const bap = this.repository.create(data);
    return await this.repository.save(bap);
  }

  async update(
    id: string,
    data: Partial<BeritaAcaraPenilaian>
  ): Promise<BeritaAcaraPenilaian | null> {
    await this.repository.update(id, data);
    return await this.repository.findOne({ where: { id } });
  }
}

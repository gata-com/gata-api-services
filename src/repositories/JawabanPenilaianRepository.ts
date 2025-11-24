import AppDataSource from "@/config/database";
import { JawabanPenilaian } from "@/entities/jawabanPenilaian";
import { Repository } from "typeorm";

export class JawabanPenilaianRepository {
  private repository: Repository<JawabanPenilaian>;

  constructor() {
    this.repository = AppDataSource.getRepository(JawabanPenilaian);
  }

  async create(data: Partial<JawabanPenilaian>): Promise<JawabanPenilaian> {
    const jawaban = this.repository.create(data);
    return await this.repository.save(jawaban);
  }

  async createMany(
    data: Partial<JawabanPenilaian>[]
  ): Promise<JawabanPenilaian[]> {
    const jawabans = this.repository.create(data);
    return await this.repository.save(jawabans);
  }

  async deleteByPenilaianId(penilaianId: string): Promise<void> {
    await this.repository.delete({ penilaianId });
  }

  async findByPenilaianId(penilaianId: string): Promise<JawabanPenilaian[]> {
    return await this.repository
      .createQueryBuilder("jawaban")
      .leftJoinAndSelect("jawaban.pertanyaan", "pertanyaan")
      .leftJoinAndSelect("jawaban.opsiJawaban", "opsiJawaban")
      .where("jawaban.penilaianId = :penilaianId", { penilaianId })
      .orderBy("pertanyaan.urutan", "ASC")
      .getMany();
  }
}

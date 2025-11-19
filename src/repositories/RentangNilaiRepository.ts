import AppDataSource from "../config/database";
import { RentangNilai } from "../entities/rentangNilai";
import { Repository } from "typeorm";

export class RentangNilaiRepository {
  private repository: Repository<RentangNilai>;

  constructor() {
    this.repository = AppDataSource.getRepository(RentangNilai);
  }

  async findAll(): Promise<RentangNilai[]> {
    return await this.repository.find({
      where: { isActive: true },
      order: { urutan: "ASC" },
    });
  }

  async findById(id: string): Promise<RentangNilai | null> {
    return await this.repository.findOne({ where: { id } });
  }

  async create(data: Partial<RentangNilai>): Promise<RentangNilai> {
    const rentang = this.repository.create(data);
    return await this.repository.save(rentang);
  }

  async update(
    id: string,
    data: Partial<RentangNilai>
  ): Promise<RentangNilai | null> {
    await this.repository.update(id, data);
    return await this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.update(id, { isActive: false });
  }

  async bulkUpdate(updates: Array<{ id: string }>): Promise<void> {
    for (const update of updates) {
      await this.repository.update(update.id, update);
    }
  }

  async getGradeByScore(score: number): Promise<string> {
    const rentangs = await this.findAll();

    // Sort by minScore descending
    rentangs.sort((a, b) => Number(b.minScore) - Number(a.minScore));

    for (const rentang of rentangs) {
      if (score >= Number(rentang.minScore)) {
        return rentang.grade;
      }
    }

    return "E"; // Default jika tidak ada yang match
  }
}

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
    return await this.repository.findOne({ where: { id, isActive: true } });
  }

  async findByGrade(grade: string): Promise<RentangNilai | null> {
    return await this.repository.findOne({
      where: { grade, isActive: true },
    });
  }

  async findByGradeExcludingId(
    grade: string,
    excludeId: string
  ): Promise<RentangNilai | null> {
    return await this.repository
      .findOne({
        where: { grade, isActive: true },
      })
      .then((result) => {
        if (result && result.id !== excludeId) {
          return result;
        }
        return null;
      });
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

  async delete(id: string): Promise<boolean> {
    // hard delete
    await this.repository.delete(id);

    return true;
  }

  async hardDelete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected ? result.affected > 0 : false;
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

  /**
   * Get minimum score to pass
   * Ambil minScore terkecil yang lebih dari 0
   * @returns minScore terkecil atau 0 jika tidak ada
   */
  async getMinScoreToPassed(): Promise<number> {
    const rentangs = await this.repository.find({
      where: { isActive: true },
      order: { minScore: "ASC" },
    });

    // Filter minScore > 0 dan ambil yang pertama (terkecil)
    const passingScore = rentangs.find((r) => Number(r.minScore) > 0);

    return passingScore ? Number(passingScore.minScore) : 0;
  }
}

import { RentangNilaiRepository } from "@/repositories/RentangNilaiRepository";
import { RentangNilai } from "../../entities/rentangNilai";

export class RentangNilaiService {
  private rentangRepo: RentangNilaiRepository;

  constructor() {
    this.rentangRepo = new RentangNilaiRepository();
  }

  async getAllRentangNilai(): Promise<any[]> {
    const rentangNilais = await this.rentangRepo.findAll();
    return this.calculateMaxScores(rentangNilais);
  }

  private calculateMaxScores(rentangNilais: RentangNilai[]): any[] {
    // Sort by minScore descending
    const sorted = [...rentangNilais].sort(
      (a, b) => Number(b.minScore) - Number(a.minScore)
    );

    return sorted.map((rentang, index) => {
      const maxScore =
        index > 0 ? Number(sorted[index - 1].minScore) - 0.01 : 100;
      return {
        ...rentang,
        minScore: Number(rentang.minScore),
        maxScore: Number(maxScore.toFixed(2)),
      };
    });
  }

  async createRentangNilai(data: {
    grade: string;
    minScore: number;
    urutan: number;
  }): Promise<RentangNilai> {
    // Check if grade already exists
    const existing = await this.rentangRepo.findByGrade(data.grade);
    if (existing) {
      throw new Error("DUPLICATE_GRADE");
    }

    return await this.rentangRepo.create(data);
  }

  async updateRentangNilai(
    id: string,
    data: Partial<RentangNilai>
  ): Promise<RentangNilai | null> {
    // Check if rentang exists
    const rentang = await this.rentangRepo.findById(id);
    if (!rentang) {
      throw new Error("NOT_FOUND");
    }

    // Check if grade is being changed and if it conflicts
    if (data.grade && data.grade !== rentang.grade) {
      const existing = await this.rentangRepo.findByGradeExcludingId(
        data.grade,
        id
      );
      if (existing) {
        throw new Error("DUPLICATE_GRADE");
      }
    }

    return await this.rentangRepo.update(id, data);
  }

  async deleteRentangNilai(id: string): Promise<boolean> {
    return await this.rentangRepo.delete(id);
  }

  async bulkUpdateRentangNilai(
    updates: Array<{
      id: string;
      grade: string;
      minScore: number;
      urutan: number;
    }>
  ): Promise<any[]> {
    const updatedItems = [];

    for (const update of updates) {
      const { id, ...data } = update;
      const rentang = await this.rentangRepo.update(id, data);
      if (rentang) {
        updatedItems.push(rentang);
      }
    }

    return this.calculateMaxScores(updatedItems);
  }

  async bulkUpsertRentangNilai(
    items: Array<{
      id?: string;
      grade: string;
      minScore: number;
      urutan: number;
    }>
  ): Promise<any[]> {
    const upsertedItems = [];

    for (const item of items) {
      const { id, grade, minScore, urutan } = item;

      if (id) {
        // Update if ID exists
        try {
          const existing = await this.rentangRepo.findById(id);
          if (existing) {
            // Check for duplicate grade if grade is being changed
            if (grade && grade !== existing.grade) {
              const dupeGrade = await this.rentangRepo.findByGradeExcludingId(
                grade,
                id
              );
              if (dupeGrade) {
                throw new Error("DUPLICATE_GRADE");
              }
            }

            const updated = await this.rentangRepo.update(id, {
              grade,
              minScore,
              urutan,
            });
            if (updated) {
              upsertedItems.push(updated);
            }
          }
        } catch (error) {
          console.error(`Error updating rentang nilai with id ${id}:`, error);
          throw error;
        }
      } else {
        // Create if no ID
        try {
          // Check if grade already exists
          const existing = await this.rentangRepo.findByGrade(grade);
          if (existing) {
            throw new Error("DUPLICATE_GRADE");
          }

          const created = await this.rentangRepo.create({
            grade,
            minScore,
            urutan,
          });
          upsertedItems.push(created);
        } catch (error) {
          console.error("Error creating rentang nilai:", error);
          throw error;
        }
      }
    }

    return this.calculateMaxScores(upsertedItems);
  }

  async getGradeByScore(score: number): Promise<string> {
    return await this.rentangRepo.getGradeByScore(score);
  }
}

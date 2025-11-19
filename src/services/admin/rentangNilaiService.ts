import { RentangNilaiRepository } from "@/repositories/RentangNilaiRepository";
import { RentangNilai } from "../../entities/rentangNilai";

export class RentangNilaiService {
  private rentangRepo: RentangNilaiRepository;

  constructor() {
    this.rentangRepo = new RentangNilaiRepository();
  }

  async getAllRentangNilai(): Promise<RentangNilai[]> {
    return await this.rentangRepo.findAll();
  }

  async createRentangNilai(data: {
    grade: string;
    minScore: number;
    urutan: number;
  }): Promise<RentangNilai> {
    return await this.rentangRepo.create(data);
  }

  async updateRentangNilai(
    id: string,
    data: Partial<RentangNilai>
  ): Promise<RentangNilai | null> {
    return await this.rentangRepo.update(id, data);
  }

  async deleteRentangNilai(id: string): Promise<void> {
    await this.rentangRepo.delete(id);
  }

  async bulkUpdateRentangNilai(
    updates: Array<{ id: string; data: Partial<RentangNilai> }>
  ): Promise<void> {
    await this.rentangRepo.bulkUpdate(updates);
  }

  async getGradeByScore(score: number): Promise<string> {
    return await this.rentangRepo.getGradeByScore(score);
  }
}

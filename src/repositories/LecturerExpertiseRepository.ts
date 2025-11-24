import { Repository } from "typeorm";
import AppDataSource from "../config/database";
import { LecturerExpertise } from "../entities/lecturerExpertise";

export class LecturerExpertiseRepository {
  public repository: Repository<LecturerExpertise>;

  constructor() {
    this.repository = AppDataSource.getRepository(LecturerExpertise);
  }

  /**
   * Find all expertises by lecturer ID
   */
  async findByLecturerId(lecturerId: number): Promise<LecturerExpertise[]> {
    return await this.repository.find({
      where: { lecturer: { id: lecturerId } },
      relations: ["expertises_group"],
    });
  }

  /**
   * Create lecturer expertise
   */
  async create(data: Partial<LecturerExpertise>): Promise<LecturerExpertise> {
    const expertise = this.repository.create(data);
    return await this.repository.save(expertise);
  }

  /**
   * Delete expertise by lecturer ID and expertise group ID
   */
  async deleteByLecturerAndExpertise(
    lecturerId: number,
    expertiseGroupId: number
  ): Promise<void> {
    await this.repository.delete({
      lecturer: { id: lecturerId },
      expertises_group: { id: expertiseGroupId },
    });
  }

  /**
   * Delete all expertises for a lecturer
   */
  async deleteByLecturerId(lecturerId: number): Promise<void> {
    await this.repository.delete({ lecturer: { id: lecturerId } });
  }

  /**
   * Check if expertise already exists for lecturer
   */
  async exists(lecturerId: number, expertiseGroupId: number): Promise<boolean> {
    const expertise = await this.repository.findOne({
      where: {
        lecturer: { id: lecturerId },
        expertises_group: { id: expertiseGroupId },
      },
    });
    return !!expertise;
  }
}

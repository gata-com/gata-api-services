import AppDataSource from "@/config/database";
import { BeritaAcaraPDF } from "@/entities/beritaAcaraPDF";
import { Repository } from "typeorm";

export class BeritaAcaraPDFRepository {
  private repository: Repository<BeritaAcaraPDF>;

  constructor() {
    this.repository = AppDataSource.getRepository(BeritaAcaraPDF);
  }

  async create(data: Partial<BeritaAcaraPDF>): Promise<BeritaAcaraPDF> {
    const bap = this.repository.create(data);
    return await this.repository.save(bap);
  }

  async findById(id: string): Promise<BeritaAcaraPDF | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ["student", "student.user"],
    });
  }

  async findByStudentId(studentId: number): Promise<BeritaAcaraPDF | null> {
    return await this.repository.findOne({
      where: { studentId },
      relations: ["student", "student.user"],
      order: { createdAt: "DESC" },
    });
  }

  async findByPdfName(pdfName: string): Promise<BeritaAcaraPDF | null> {
    return await this.repository.findOne({
      where: { pdfName },
      relations: ["student", "student.user"],
    });
  }

  async update(
    id: string,
    data: Partial<BeritaAcaraPDF>
  ): Promise<BeritaAcaraPDF | null> {
    await this.repository.update(id, data);
    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== 0;
  }

  async findAll(): Promise<BeritaAcaraPDF[]> {
    return await this.repository.find({
      relations: ["student", "student.user"],
      order: { createdAt: "DESC" },
    });
  }
}

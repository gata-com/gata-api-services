import { Repository, QueryRunner } from "typeorm";
import AppDataSource from "../config/database";
import { Student } from "@/entities/student";

export class StudentRepository {
  public repository: Repository<Student>;

  public AppDataSource: any;

  constructor(private queryRunner?: QueryRunner) {
    if (queryRunner) {
      this.repository = queryRunner.manager.getRepository(Student);
    } else {
      this.repository = AppDataSource.getRepository(Student);
    }

    this.AppDataSource = AppDataSource;
  }

  /**
   * FIND
   *
   * @returns
   */

  async findByUserId(userId: number): Promise<Student | null> {
    return await this.repository.findOne({
      where: { user: { id: userId } },
    });
  }

  async findByUserIdWithFinalProject(userId: number): Promise<Student | null> {
    return await this.repository.findOne({
      where: {
        user: { id: userId },
        final_project_members: { final_project: { admin_status: "approved" } },
      },
      relations: [
        "final_project_members",
        "final_project_members.final_project",
      ],
    });
  }

  async findById(id: number): Promise<Student | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ["user"],
    });
  }

  async findByNim(nim: string): Promise<Student | null> {
    return await this.repository.findOne({
      where: { nim },
    });
  }

  async findAll(): Promise<Student[]> {
    return await this.repository.find({
      relations: ["user"],
    });
  }

  async update(id: number, data: any): Promise<void> {
    await this.repository.update(id, data);
  }
}

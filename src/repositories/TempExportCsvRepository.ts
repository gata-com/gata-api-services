import { Repository } from "typeorm";
import AppDataSource from "../config/database";
import { TempExportCsv } from "@/entities/tempExportCsv";

export class TempExportCsvRepository {
  public repository: Repository<TempExportCsv>;

  constructor() {
    this.repository = AppDataSource.getRepository(TempExportCsv);
  }

  async insertTempData(data: any): Promise<TempExportCsv | any> {
    const tempData = this.repository.create(data);
    return await this.repository.save(tempData);
  }

  async deleteAll() {
    // cleart all data in the table
    await this.repository.clear();
  }

  async findAll(): Promise<TempExportCsv[]> {
    return await this.repository.find();
  }
}

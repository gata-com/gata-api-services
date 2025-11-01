import { FinalProjectPeriodsRepository } from "@/repositories/FinalProjectPeriodsRepository";
import { FinalProjectRepository } from "@/repositories/FinalProjectRepository";
import { ErrorValidation } from "@/types";
import { FinalProjectPeriodsRequest } from "@/types/admin";
import { ServicesReturn } from "@/types";

export class TugasAkhirService {
  private fpRepo: FinalProjectRepository;
  private fppRepo: FinalProjectPeriodsRepository;

  constructor() {
    this.fpRepo = new FinalProjectRepository();
    this.fppRepo = new FinalProjectPeriodsRepository();
  }

  async getCurrentPeriod() {
    try {
      return await this.fppRepo.findCurrentPeriod();
    } catch (error) {
      throw error;
    }
  }

  async createPeriod(
    data: FinalProjectPeriodsRequest
  ): Promise<ServicesReturn | { error: ErrorValidation }> {
    // transaction DB
    const qr = this.fppRepo.AppDataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const { start_date, end_date, description } = data;

      // start_date must be before end_date
      // if (new Date(start_date) >= new Date(end_date)) {
      //   return {
      //     error: {
      //       path: "start_date",
      //       msg: "Tanggal buka harus sebelum tanggal tutup",
      //     },
      //   };
      // }

      // start_date must be unique
      const existingPeriods = await this.fppRepo.findAll();
      const isStartDateExists = existingPeriods.some(
        (period) =>
          new Date(period.start_date).toDateString() ===
          new Date(start_date).toDateString()
      );
      if (isStartDateExists) {
        return {
          error: {
            path: "start_date",
            msg: "Tanggal buka sudah terdaftar",
          },
        };
      }

      const createdData = await this.fppRepo.create(data);

      // commit transaction
      await qr.commitTransaction();

      return { error: null, data: createdData };
    } catch (error) {
      // rollback transaction on error
      await qr.rollbackTransaction();
      throw error;
    } finally {
      // release query runner
      await qr.release();
    }
  }

  async getDosen(): Promise<ServicesReturn | { error: ErrorValidation }> {
    try {
      const data = await this.fpRepo.getDosen();
      return { error: null, data };
    } catch (error) {
      throw error;
    }
  }

  async getPengajuan(): Promise<ServicesReturn | { error: ErrorValidation }> {
    try {
      const data = await this.fpRepo.getPengajuan();
      return { error: null, data };
    } catch (error) {
      throw error;
    }
  }

}

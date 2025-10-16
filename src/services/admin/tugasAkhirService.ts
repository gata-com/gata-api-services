import { FinalProjectPeriodsRepository } from "@/repositories/FinalProjectPeriodsRepository";
import { ErrorValidation } from "@/types";
import { FinalProjectPeriodsRequest } from "@/types/admin";

export class TugasAkhirService {
  private repository: FinalProjectPeriodsRepository;

  constructor() {
    this.repository = new FinalProjectPeriodsRepository();
  }

  async getCurrentPeriod() {
    try {
      return await this.repository.findCurrentPeriod();
    } catch (error) {
      throw error;
    }
  }

  async createPeriod(
    data: FinalProjectPeriodsRequest
  ): Promise<{ error: null; data: any } | { error: ErrorValidation }> {
    // transaction DB
    await this.repository.qr.connect();
    await this.repository.qr.startTransaction();

    try {
      const { start_date, end_date, description } = data;

      if (!start_date) {
        return {
          error: { path: "start_date", msg: "Tanggal buka harus diisi" },
        };
      }
      if (!end_date) {
        return {
          error: { path: "end_date", msg: "Tanggal tutup harus diisi" },
        };
      }

      // start_date must be before end_date
      if (new Date(start_date) >= new Date(end_date)) {
        return {
          error: {
            path: "start_date",
            msg: "Tanggal buka harus sebelum tanggal tutup",
          },
        };
      }

      // start_date must be unique
      const existingPeriods = await this.repository.findAll();
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

      const createdData = await this.repository.create(data);

      // commit transaction
      await this.repository.qr.commitTransaction();

      return { error: null, data: createdData };
    } catch (error) {
      // rollback transaction on error
      await this.repository.qr.rollbackTransaction();
      throw error;
    } finally {
      // release query runner
      await this.repository.qr.release();
    }
  }
}

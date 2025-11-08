import { UserRepository } from "@/repositories/UserRepository";
import { LecturerRepository } from "@/repositories/LecturerRepository";
import { FinalProjectRepository } from "@/repositories/FinalProjectRepository";
import { ErrorValidation } from "@/types";
import { ServicesReturn } from "@/types";
import { FPApprovalRequest, FPAddSlotRequest } from "@/types/lecturer";
import { FinalProjectPeriodsRepository } from "@/repositories/FinalProjectPeriodsRepository";

export class FinalProjectService {
  // private repository:
  private userRepo: UserRepository;
  private lecturerRepo: LecturerRepository;
  private finalProjectRepo: FinalProjectRepository;
  private fppRepo: FinalProjectPeriodsRepository;

  constructor() {
    this.userRepo = new UserRepository();
    this.lecturerRepo = new LecturerRepository();
    this.finalProjectRepo = new FinalProjectRepository();
    this.fppRepo = new FinalProjectPeriodsRepository();
  }

  async getCurrentPeriodApproval() {
    try {
      return await this.fppRepo.findCurrentPeriodApproval();
    } catch (error) {
      throw error;
    }
  }

  async getValidationStats(
    userId: number
  ): Promise<ServicesReturn | { error: ErrorValidation }> {
    try {
      const result = await this.finalProjectRepo.findValidationStats(userId);

      return { error: null, data: result };
    } catch (error) {
      throw error;
    }
  }

  async getValidationData(
    userId: number
  ): Promise<ServicesReturn | { error: ErrorValidation }> {
    try {
      const results = await this.finalProjectRepo.findValidationData(userId);

      // Format result sesuai kebutuhan frontend
      if (results) {
        results.map((row: any) => {
          //   cek apakah row memiliki key object supervisor_1
          if (row.supervisor_1?.user?.id === userId) {
            row.supervisor_choices = "1";
            row.supervisor_status = row.supervisor_1_status;
          }

          //   cek apakah row memiliki key object supervisor_2
          if (row.supervisor_2?.user?.id === userId) {
            row.supervisor_choices = "2";
            row.supervisor_status = row.supervisor_2_status;
          }

          // hapus data yang tidak perlu
          delete row.supervisor_1;
          delete row.supervisor_2;
        });
      }
      return { error: null, data: results };
    } catch (error) {
      throw error;
    }
  }

  async approval(
    data: FPApprovalRequest
  ): Promise<ServicesReturn | { error: ErrorValidation }> {
    try {
      // Cek apakah fpId ada
      const fp = await this.finalProjectRepo.findById(data.fpId);
      if (!fp) {
        return {
          error: { path: "server", msg: "Tugas akhir tidak ditemukan" },
        };
      }

      const result = await this.finalProjectRepo.approval(data);
      const { error } = result;

      if (error) {
        return { error: error };
      }

      return { error: null, data: result };
    } catch (error) {
      throw error;
    }
  }

  async addSlot(
    data: FPAddSlotRequest
  ): Promise<ServicesReturn | { error: ErrorValidation }> {
    const { userId, supervisorType, amount } = data;

    try {
      // cek apakah dosen ada
      const lc = await this.lecturerRepo.findByUserId(userId);

      if (!lc) {
        return {
          error: { path: "server", msg: "Dosen tidak ditemukan" },
        };
      }

      const result = await this.lecturerRepo.addSlot(lc.id, data);

      return { error: null, data: result };
    } catch (error) {
      throw error;
    }
  }
}

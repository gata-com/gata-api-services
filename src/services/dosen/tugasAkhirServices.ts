import { UserRepository } from "@/repositories/UserRepository";
import { FinalProjectRepository } from "@/repositories/FinalProjectRepository";
import { ErrorValidation } from "@/types";
import { ServicesReturn } from "@/types";
import { FPApprovalRequest } from "@/types/dosen";

export class TugasAkhirService {
  // private repository:
  private userRepo: UserRepository;
  private finalProjectRepo: FinalProjectRepository;

  constructor() {
    this.userRepo = new UserRepository();
    this.finalProjectRepo = new FinalProjectRepository();
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
      const finalProject = await this.finalProjectRepo.findById(data.fpId);
      if (!finalProject) {
        return {
          error: { path: "server", msg: "Tugas akhir tidak ditemukan" },
        };
      }

      // Lakukan proses approval
      if (data.supervisor_choices === "1") {
        finalProject.supervisor_1_status = data.status;
      } else if (data.supervisor_choices === "2") {
        finalProject.supervisor_2_status = data.status;
      }
      const result = await this.finalProjectRepo.repository.save(finalProject);

      return { error: null, data: result };
    } catch (error) {
      throw error;
    }
  }
}

import { UserRepository } from "@/repositories/UserRepository";
import { FinalProjectRepository } from "@/repositories/FinalProjectRepository";
import { ErrorValidation } from "@/types";
import {
  FinalProjectSearchByQueryRequest,
  FinalProjectCreateRequest,
} from "@/types/mahasiswa";

export class TugasAkhirService {
  // private repository:
  private userRepo: UserRepository;
  private finalProjectRepo: FinalProjectRepository;

  constructor() {
    this.userRepo = new UserRepository();
    this.finalProjectRepo = new FinalProjectRepository();
  }

  async getDataByQuery(
    data: FinalProjectSearchByQueryRequest
  ): Promise<{ error: null; data: any } | { error: ErrorValidation }> {
    try {
      const result = await this.userRepo.findByQueryEmail(data.query);
      return { error: null, data: result };
    } catch (error) {
      throw error;
    }
  }

  async getLecturers(): Promise<
    { error: null; data: any } | { error: ErrorValidation }
  > {
    try {
      const result = await this.userRepo.findAllWithLecturer();
      return { error: null, data: result };
    } catch (error) {
      throw error;
    }
  }

  async createFinalProject(
    data: FinalProjectCreateRequest
  ): Promise<{ error: null; data: any } | { error: ErrorValidation }> {
    // transaction DB
    await this.finalProjectRepo.qr.connect();
    await this.finalProjectRepo.qr.startTransaction();
    try {
      const {
        type,
        status,
        source_topic,
        supervisor1Id,
        supervisor2Id,
        finalProjectPeriodId,
        members,
      } = data;

      console.log("Submitted Data:", data);

      if (!type) {
        return {
          error: { field: "type", msg: "Tipe tugas akhir harus diisi" },
        };
      }

      if (!status) {
        return {
          error: { field: "status", msg: "Status tugas akhir harus diisi" },
        };
      }
      if (!supervisor1Id) {
        return {
          error: { field: "supervisor1Id", msg: "Pembimbing 1 harus diisi" },
        };
      }
      if (supervisor1Id === supervisor2Id) {
        return {
          error: {
            field: "supervisor2Id",
            msg: "Pembimbing 2 tidak boleh sama dengan Pembimbing 1",
          },
        };
      }

      if (!source_topic) {
        return {
          error: { field: "source_topic", msg: "Sumber topik harus diisi" },
        };
      }

      if (!finalProjectPeriodId) {
        return {
          error: {
            field: "finalProjectPeriodId",
            msg: "Periode tugas akhir harus diisi",
          },
        };
      }

      if (!members || members.length === 0) {
        return {
          error: { field: "members", msg: "Data tugas akhir harus diisi" },
        };
      }
      // Validasi setiap item dalam members
      for (let i = 0; i < members.length; i++) {
        const item = members[i];
        if (!item.email) {
          return {
            error: {
              field: `members[${i}].email`,
              msg: `Email anggota ke ${i + 1} harus diisi`,
            },
          };
        }
        if (!item.title) {
          return {
            error: {
              field: `members[${i}].title`,
              msg: `Judul anggota ke ${i + 1} harus diisi`,
            },
          };
        }
        if (!item.resume) {
          return {
            error: {
              field: `members[${i}].resume`,
              msg: `Resume anggota ke ${i + 1} harus diisi`,
            },
          };
        }
        // Validasi file draft_path (setelah mapping dari controller)
        if (
          !item.draft_path ||
          (typeof item.draft_path === "object" && !item.draft_path.buffer)
        ) {
          return {
            error: {
              field: `members[${i}].draft_path`,
              msg: `Draft anggota ke ${i + 1} harus diunggah`,
            },
          };
        }
        // Validasi file dispen_path (setelah mapping dari controller)
        if (
          !item.dispen_path ||
          (typeof item.dispen_path === "object" && !item.dispen_path.buffer)
        ) {
          return {
            error: {
              field: `members[${i}].dispen_path`,
              msg: `Surat dispensasi anggota ke ${i + 1} harus diunggah`,
            },
          };
        }
      }

      const newFinalProjectsData = {
        type,
        status,
        source_topic,
        supervisor1Id,
        supervisor2Id,
        finalProjectPeriodId,
      };
      // Simpan data tugas akhir ke database
      const createdData =
        await this.finalProjectRepo.createWithFinalProjectMember(
          newFinalProjectsData,
          members
        );

      // commit transaction
      await this.finalProjectRepo.qr.commitTransaction();

      return { error: null, data: createdData };
    } catch (error) {
      // rollback transaction on error
      await this.finalProjectRepo.qr.rollbackTransaction();
      throw error;
    } finally {
      // release query runner
      await this.finalProjectRepo.qr.release();
    }
  }
}

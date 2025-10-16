import { Request } from "express";
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

  async getHistoryByUserId(
    userId: string
  ): Promise<{ error: null; data: any } | { error: ErrorValidation }> {
    try {
      const studentId = await this.userRepo.findUserWithStudentById(
        parseInt(userId)
      );

      if (!studentId) {
        return {
          error: { path: "userId", msg: "Mahasiswa tidak ditemukan" },
        };
      }

      const result = await this.finalProjectRepo.findHistoryByUserId(
        studentId?.id!
      );

      // Format result sesuai kebutuhan frontend
      // filter member hanya yang sesuai dengan studentId
      // ambil semua student dari members dan masukkan ke array kemudian masukkan ke result dengan key bernama allStudents
      if (result) {
        (result as any).students = result.members.map((m: any) => m.student);
        (result as any).documents = result.members.map((m: any) => {
          return {
            id: m.id,
            draft_path: m.draft_path,
            draft_filename: m.draft_filename,
            draft_size: m.draft_size,
            dispen_path: m.dispen_path,
            dispen_filename: m.dispen_filename,
            dispen_size: m.dispen_size,
            created_at: m.created_at,
          };
        });
        (result.members as any) = result.members
          .map((m: any) => {
            if (m.student.id === studentId?.id!) {
              return {
                id: m.id,
                title: m.title,
                resume: m.resume,
                created_at: m.created_at,
              };
            }
            return null; // Ensure all code paths return a value
          })
          .filter((m: any) => m !== null); // Remove null values
      }

      return { error: null, data: result };
    } catch (error) {
      throw error;
    }
  }

  async createFinalProject(
    req: Request,
    data: FinalProjectCreateRequest
  ): Promise<{ error: null; data: any } | { error: ErrorValidation }> {
    // transaction DB
    await this.finalProjectRepo.qr.connect();
    await this.finalProjectRepo.qr.startTransaction();
    try {
      // Parse body data
      const bodyData = data;

      // Handle uploaded files from multer
      const files = req.files as Express.Multer.File[];

      // Map files ke members berdasarkan field name (draft_path_0, dispen_path_0, dll)
      if (bodyData.members && files && files.length > 0) {
        bodyData.members = bodyData.members.map((member, index) => {
          // Cari file berdasarkan fieldname
          const draftFile = files.find(
            (f) => f.fieldname === `draft_path_${index}`
          );
          const dispenFile = files.find(
            (f) => f.fieldname === `dispen_path_${index}`
          );

          return {
            ...member,
            draft_path: draftFile || null,
            dispen_path: dispenFile || null,
          };
        });
      }

      const {
        type,
        status,
        source_topic,
        supervisor1Id,
        supervisor2Id,
        finalProjectPeriodId,
        members,
      } = bodyData;

      // Validasi file untuk setiap member
      for (let i = 0; i < members.length; i++) {
        const item = members[i];
        // Validasi file draft_path
        if (
          !item.draft_path ||
          (typeof item.draft_path === "object" && !item.draft_path.buffer)
        ) {
          return {
            error: {
              path: `members[${i}].draft_path`,
              msg: `Draft anggota ke ${i + 1} harus diunggah`,
            },
          };
        }
        // Validasi file dispen_path
        if (status === "dispensasi") {
          if (
            !item.dispen_path ||
            (typeof item.dispen_path === "object" && !item.dispen_path?.buffer)
          ) {
            return {
              error: {
                path: `members[${i}].dispen_path`,
                msg: `Surat dispensasi anggota ke ${i + 1} harus diunggah`,
              },
            };
          }
        }
      }

      const newFinalProjectsData = {
        type,
        status,
        source_topic,
        supervisor1Id: parseInt(supervisor1Id),
        supervisor2Id: parseInt(supervisor2Id),
        finalProjectPeriodId: parseInt(finalProjectPeriodId),
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

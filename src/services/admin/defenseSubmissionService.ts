import { DefenseSubmissionRepository } from "@/repositories/DefenseSubmissionRepository";
import { DefenseScheduleRepository } from "@/repositories/DefenseScheduleRepository";
import { LecturerRepository } from "@/repositories/LecturerRepository";

interface UnscheduledDefenseResponse {
  id: number;
  nim: string;
  name: string;
  judul: string;
  tipeSidang: string;
  pembimbing1: string;
  pembimbing2: string;
  penguji1: string;
  penguji2: string;
  kk1: string;
  kk2: string;
}

interface ExaminerRequest {
  pengajuanId: number;
  tanggal: string;
  mulai: string;
  selesai: string;
  type: string;
  lokasi: string;
  judul: string;
  nim: string;
  namaMahasiswa: string;
  capstone?: string;
  pembimbing1: string;
  pembimbing2?: string;
  penguji1?: string;
  penguji2?: string;
}

export class DefenseSubmissionService {
  private defenseSubmissionRepo: DefenseSubmissionRepository;
  private defenseScheduleRepo: DefenseScheduleRepository;
  private lecturerRepo: LecturerRepository;

  constructor() {
    this.defenseSubmissionRepo = new DefenseSubmissionRepository();
    this.defenseScheduleRepo = new DefenseScheduleRepository();
    this.lecturerRepo = new LecturerRepository();
  }

  /**
   * Get all defense submissions that don't have a schedule yet
   * Kolom: NIM, Name, Judul, tipeSidang, Pembimbing1, Pembimbing2, kk1, kk2
   * @returns Array of unscheduled defense submissions with required fields
   */
  async getNotScheduled(): Promise<{
    data?: UnscheduledDefenseResponse[];
    error?: any;
  }> {
    try {
      // Get all unscheduled defense submissions from repository
      const unscheduledSubmissions =
        await this.defenseSubmissionRepo.findUnscheduled();

      // Transform data ke format yang diminta
      const response: UnscheduledDefenseResponse[] = unscheduledSubmissions
        .map((defenseSubmission: any) => {
          const member = defenseSubmission.final_project.members[0];
          const student = member?.student;
          const user = student?.user;
          const penguji1 = defenseSubmission.examiner_1;
          const penguji2 = defenseSubmission.examiner_2;
          const supervisor1 = defenseSubmission.final_project.supervisor_1;
          const supervisor2 = defenseSubmission.final_project.supervisor_2;
          const eg1 = defenseSubmission.expertises_group_1;
          const eg2 = defenseSubmission.expertises_group_2;

          return {
            id: defenseSubmission.id,
            nim: student?.nim || "-",
            name: user?.name || "-",
            judul: member?.title || "-",
            tipeSidang: defenseSubmission.defense_type || "-",
            pembimbing1: supervisor1?.user?.name || "-",
            pembimbing2: supervisor2?.user?.name || "-",
            penguji1: penguji1?.user?.name || "-",
            penguji2: penguji2?.user?.name || "-",
            kk1: eg1?.name || "-",
            kk2: eg2?.name || "-",
          };
        })
        .filter(
          (item: UnscheduledDefenseResponse) =>
            item.nim !== "-" && item.name !== "-" && item.judul !== "-"
        );

      return { data: response };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  async getAllExaminers(): Promise<{
    data?: { id: number; name: string }[];
    error?: any;
  }> {
    try {
      // Get all examiners from repository
      const examiners = await this.lecturerRepo.findAllExaminers();

      // Map hasil query ke format response
      const response: { id: number; name: string }[] = examiners.map(
        (lc: any) => ({
          id: lc.id,
          name: lc.name || "-",
        })
      );

      return { data: response };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  async addSchedule(scheduleData: ExaminerRequest): Promise<{
    data?: any;
    error?: any;
  }> {
    try {
      // Validasi required fields
      if (!scheduleData.pengajuanId) {
        return {
          error: "pengajuanId (defenseSubmissionId) wajib diisi",
        };
      }

      if (!scheduleData.tanggal) {
        return {
          error: "tanggal (scheduled_date) wajib diisi",
        };
      }

      if (!scheduleData.mulai) {
        return {
          error: "mulai (start_time) wajib diisi",
        };
      }

      if (!scheduleData.selesai) {
        return {
          error: "selesai (end_time) wajib diisi",
        };
      }

      // Cari ID examiner dari nama
      let examiner_1_id: number | null = null;
      let examiner_2_id: number | null = null;

      if (scheduleData.penguji1) {
        const examiner1 = await this.lecturerRepo.findByName(
          scheduleData.penguji1
        );
        if (examiner1) {
          examiner_1_id = examiner1.id;
        } else {
          return {
            error: `Dosen penguji 1 "${scheduleData.penguji1}" tidak ditemukan`,
          };
        }
      }

      if (scheduleData.penguji2) {
        const examiner2 = await this.lecturerRepo.findByName(
          scheduleData.penguji2
        );
        if (examiner2) {
          examiner_2_id = examiner2.id;
        } else {
          return {
            error: `Dosen penguji 2 "${scheduleData.penguji2}" tidak ditemukan`,
          };
        }
      }

      // Map data dari request ke format yang dibutuhkan repository
      const createScheduleData = {
        scheduled_date: scheduleData.tanggal, // YYYY-MM-DD
        start_time: scheduleData.mulai, // HH:mm
        end_time: scheduleData.selesai, // HH:mm
        room: scheduleData.lokasi || "Prodi", // lokasi / default "Prodi"
      };

      // Create schedule via repository
      const schedule = await this.defenseScheduleRepo.createSchedule(
        scheduleData.pengajuanId,
        createScheduleData
      );

      // Update examiner di defense submission jika ada
      if (examiner_1_id || examiner_2_id) {
        await this.defenseSubmissionRepo.updateDefenseSchedule(
          scheduleData.pengajuanId,
          {
            examiner_1_id,
            examiner_2_id,
          }
        );
      }

      return {
        data: {
          id: schedule.id,
          defense_submission_id: schedule.defense_submission.id,
          scheduled_date: schedule.scheduled_date,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          room: schedule.room,
          status: schedule.status,
          examiner_1_id,
          examiner_2_id,
          message: "Jadwal sidang berhasil dibuat",
        },
      };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }
}

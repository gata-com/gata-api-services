import { DefenseScheduleRepository } from "@/repositories/DefenseScheduleRepository";
import { LecturerRepository } from "@/repositories/LecturerRepository";
import { DefenseSubmissionRepository } from "@/repositories/DefenseSubmissionRepository";
import fs from "fs";

interface ScheduleRow {
  original_idx: string;
  nim: string;
  nama: string;
  capstone_code: string;
  type: string;
  Date: string;
  "Start Time": string;
  "End Time": string;
  spv_1: string;
  spv_2: string;
  examiner_1: string;
  examiner_2: string;
  status: string;
  field_1: string;
  field_2: string;
}

export class DefenseScheduleImportService {
  private scheduleRepo: DefenseScheduleRepository;
  private lecturerRepo: LecturerRepository;
  private defenseSubmissionRepo: DefenseSubmissionRepository;

  constructor() {
    this.scheduleRepo = new DefenseScheduleRepository();
    this.lecturerRepo = new LecturerRepository();
    this.defenseSubmissionRepo = new DefenseSubmissionRepository();
  }

  /**
   * Parse date dari format "Senin, 22 September 2025" ke "YYYY-MM-DD"
   * @param dateStr Date string dari scheduler
   * @returns ISO date string
   */
  private parseDateString(dateStr: string): string {
    // Remove day name
    const cleanDate = dateStr.replace(/^[A-Za-z]+,\s*/, "");

    // Parse "22 September 2025"
    const months: { [key: string]: string } = {
      Januari: "01",
      Februari: "02",
      Maret: "03",
      April: "04",
      Mei: "05",
      Juni: "06",
      Juli: "07",
      Agustus: "08",
      September: "09",
      Oktober: "10",
      November: "11",
      Desember: "12",
    };

    const parts = cleanDate.split(" ");
    const day = parts[0].padStart(2, "0");
    const month = months[parts[1]];
    const year = parts[2];

    return `${year}-${month}-${day}`;
  }

  /**
   * Parse CSV file dari scheduler dan simpan ke database
   * @param filePath Path to uploaded CSV file
   * @returns Import result summary
   */
  async importScheduleFromCSV(filePath: string): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    const result = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    try {
      // Read CSV file
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const lines = fileContent.split("\n").filter((line) => line.trim());

      // Skip header row
      const dataLines = lines.slice(1);

      // filter if columns[3] (capstone_code) is same delete duplicate rows
      const uniqueLinesMap: { [key: string]: string } = {};
      for (const line of dataLines) {
        const columns = this.parseCSVLine(line);
        const capstone_code = columns[3];

        // jika capstone_code kosong atau "" (reguler), tambahkan data ke uniqueLinesMap dengan key random
        if (!capstone_code) {
          const randomKey = Math.random().toString(36).substring(2, 15);
          uniqueLinesMap[randomKey] = line;
          continue;
        }
        uniqueLinesMap[capstone_code] = line;
      }

      const uniqueLines = Object.values(uniqueLinesMap);

      for (let i = 0; i < uniqueLines.length; i++) {
        try {
          const line = uniqueLines[i];
          const columns = this.parseCSVLine(line);

          if (columns.length < 15) {
            result.errors.push(`Row ${i + 2}: Invalid column count`);
            result.failed++;
            continue;
          }

          const row: ScheduleRow = {
            original_idx: columns[0],
            nim: columns[1],
            nama: columns[2],
            capstone_code: columns[3],
            type: columns[4],
            Date: columns[5],
            "Start Time": columns[6],
            "End Time": columns[7],
            spv_1: columns[8],
            spv_2: columns[9],
            examiner_1: columns[10],
            examiner_2: columns[11],
            status: columns[12],
            field_1: columns[13],
            field_2: columns[14],
          };

          // Parse date
          const scheduledDate = this.parseDateString(row.Date);

          // Upsert schedule
          const schedule = await this.scheduleRepo.upsertSchedule({
            nim: row.nim,
            scheduled_date: scheduledDate,
            start_time: row["Start Time"],
            end_time: row["End Time"],
            scheduler_status: row.status,
            examiner_1: row.examiner_1,
            examiner_2: row.examiner_2,
          });

          if (schedule) {
            result.success++;
          } else {
            result.failed++;
            result.errors.push(
              `Row ${i + 2}: Defense submission not found for code ${
                row.capstone_code
              }`
            );
          }
        } catch (error) {
          result.failed++;
          result.errors.push(
            `Row ${i + 2}: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }

      // Delete uploaded file after processing
      fs.unlinkSync(filePath);
    } catch (error) {
      throw new Error(
        `Failed to import CSV: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    return result;
  }

  /**
   * Parse CSV line dengan support untuk quoted values
   * @param line CSV line
   * @returns Array of column values
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // Toggle quotes
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        // End of column
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    // Push last column
    result.push(current.trim());

    return result;
  }

  /**
   * Get all schedules with filters
   * @param filters Optional filters
   * @returns Schedules array
   */
  async getSchedules(filters?: {
    status?: string;
    date_from?: string;
    date_to?: string;
  }) {
    return this.scheduleRepo.findAll(filters);
  }

  /**
   * Get schedule by defense submission ID
   * @param defenseSubmissionId
   * @returns Schedule or null
   */
  async getScheduleByDefenseSubmission(defenseSubmissionId: number) {
    return this.scheduleRepo.findByDefenseSubmissionId(defenseSubmissionId);
  }

  /**
   * Get all schedules in formatted response
   * @returns Array of schedules in the required format
   */
  async getAllSchedules() {
    const schedules = await this.scheduleRepo.findAll();

    return schedules.map((schedule) => {
      // Get student data from final project members
      const member = schedule.defense_submission.final_project.members[0];
      const fp = schedule.defense_submission.final_project;
      const student = member?.student;
      const user = student?.user;

      // Get supervisor and examiner names
      const supervisor1 = fp.supervisor_1;
      const supervisor2 = fp.supervisor_2;
      const examiner1 = schedule.defense_submission.examiner_1;
      const examiner2 = schedule.defense_submission.examiner_2;

      return {
        id: schedule.id,
        nim: student?.nim || "-",
        name: user?.name || "-",
        judul: member?.title || "-",
        type: schedule.defense_submission.defense_type || "-",
        date: schedule.scheduled_date || "-",
        startTime: schedule.start_time || "-",
        endTime: schedule.end_time || "-",
        spv_1: supervisor1?.user?.name || "-",
        spv_2: supervisor2?.user?.name || "-",
        examiner_1: examiner1?.user?.name || "-",
        examiner_2: examiner2?.user?.name || "-",
        status: schedule.status || "-",
        location: schedule.room || "Prodi",
      };
    });
  }

  /**
   * Get schedule by ID with formatted response
   * @param id Schedule ID
   * @returns Formatted schedule data or null
   */
  async getScheduleById(id: number): Promise<any> {
    const schedule = await this.scheduleRepo.findById(id);

    if (!schedule) {
      return null;
    }

    const member = schedule.defense_submission.final_project.members[0];
    const student = member?.student;
    const user = student?.user;
    const supervisor1 = schedule.defense_submission.final_project.supervisor_1;
    const supervisor2 = schedule.defense_submission.final_project.supervisor_2;
    const examiner1 = schedule.defense_submission.examiner_1;
    const examiner2 = schedule.defense_submission.examiner_2;
    const eg1 = schedule.defense_submission.expertises_group_1;
    const eg2 = schedule.defense_submission.expertises_group_2;

    return {
      id: schedule.id,
      pengajuanId: schedule.defense_submission.id,
      tanggal: schedule.scheduled_date,
      mulai: schedule.start_time,
      selesai: schedule.end_time,
      type: schedule.defense_submission.defense_type || "-",
      lokasi: schedule.room || "Prodi",
      judul: member?.title || "-",
      nim: student?.nim || "-",
      namaMahasiswa: user?.name || "-",
      pembimbing1: supervisor1?.user?.name || "-",
      pembimbing2: supervisor2?.user?.name || "-",
      penguji1: examiner1?.user?.name || "-",
      penguji2: examiner2?.user?.name || "-",
      kk1: eg1?.name || "-",
      kk2: eg2?.name || "-",
      status: schedule.status,
    };
  }

  /**
   * Update defense schedule
   * @param id Schedule ID
   * @param data Updated schedule data
   * @returns Updated schedule or error
   */
  async updateSchedule(
    id: number,
    data: {
      tanggal?: string;
      mulai?: string;
      selesai?: string;
      lokasi?: string;
    }
  ): Promise<{ data?: any; error?: any }> {
    try {
      // Validate required fields
      if (data.tanggal && !this.isValidDate(data.tanggal)) {
        return { error: "Format tanggal tidak valid (YYYY-MM-DD)" };
      }

      if (data.mulai && !this.isValidTime(data.mulai)) {
        return { error: "Format mulai tidak valid (HH:mm)" };
      }

      if (data.selesai && !this.isValidTime(data.selesai)) {
        return { error: "Format selesai tidak valid (HH:mm)" };
      }

      // Check if mulai < selesai
      if (data.mulai && data.selesai) {
        if (data.mulai >= data.selesai) {
          return { error: "Waktu mulai harus lebih kecil dari waktu selesai" };
        }
      }

      // Check if schedule exists
      const existingSchedule = await this.scheduleRepo.findById(id);
      if (!existingSchedule) {
        return { error: "Jadwal tidak ditemukan" };
      }

      // Update schedule
      const updateData = {
        scheduled_date: data.tanggal,
        start_time: data.mulai,
        end_time: data.selesai,
        room: data.lokasi,
      };

      const updatedSchedule = await this.scheduleRepo.updateSchedule(
        id,
        updateData
      );

      if (!updatedSchedule) {
        return { error: "Gagal mengupdate jadwal" };
      }

      const response = await this.getScheduleById(id);
      return { data: response };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Update defense schedule with examiner lookup
   * @param scheduleId Schedule ID
   * @param defenseSubmissionId Defense submission ID
   * @param data Updated schedule data with examiner names
   * @returns Updated schedule or error
   */
  async updateScheduleWithExaminer(
    scheduleId: number,
    defenseSubmissionId: number,
    data: {
      tanggal?: string;
      mulai?: string;
      selesai?: string;
      lokasi?: string;
      penguji1?: string;
      penguji2?: string;
    }
  ): Promise<{ data?: any; error?: any }> {
    try {
      // Lookup examiner IDs dari nama
      let examiner_1_id: number | null = null;
      let examiner_2_id: number | null = null;

      if (data.penguji1) {
        const examiner1 = await this.lecturerRepo.findByName(data.penguji1);
        if (!examiner1) {
          return {
            error: `Dosen penguji 1 "${data.penguji1}" tidak ditemukan`,
          };
        }
        examiner_1_id = examiner1.id;
      }

      if (data.penguji2) {
        const examiner2 = await this.lecturerRepo.findByName(data.penguji2);
        if (!examiner2) {
          return {
            error: `Dosen penguji 2 "${data.penguji2}" tidak ditemukan`,
          };
        }
        examiner_2_id = examiner2.id;
      }

      // Update schedule
      const updatedSchedule = await this.updateSchedule(scheduleId, {
        tanggal: data.tanggal,
        mulai: data.mulai,
        selesai: data.selesai,
        lokasi: data.lokasi,
      });

      if ("error" in updatedSchedule && updatedSchedule.error) {
        return updatedSchedule;
      }

      // Update examiner di defense submission
      if (examiner_1_id || examiner_2_id) {
        await this.defenseSubmissionRepo.updateDefenseSchedule(
          defenseSubmissionId,
          {
            examiner_1_id,
            examiner_2_id,
          }
        );
      }

      return {
        data: {
          ...updatedSchedule.data,
          examiner_1_id,
          examiner_2_id,
        },
      };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Delete defense schedule
   * @param id Schedule ID
   * @returns Success or error
   */
  async deleteSchedule(id: number): Promise<{ error?: any }> {
    try {
      // Check if schedule exists
      const schedule = await this.scheduleRepo.findById(id);
      if (!schedule) {
        return { error: "Jadwal tidak ditemukan" };
      }

      // Delete schedule
      await this.scheduleRepo.deleteSchedule(id);

      return {};
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Validate date format YYYY-MM-DD
   * @param date Date string
   * @returns true if valid
   */
  private isValidDate(date: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date));
  }

  /**
   * Validate time format HH:mm
   * @param time Time string
   * @returns true if valid
   */
  private isValidTime(time: string): boolean {
    return /^([0-1]\d|2[0-3]):([0-5]\d)$/.test(time);
  }
}

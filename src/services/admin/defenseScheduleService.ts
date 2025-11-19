import { DefenseScheduleRepository } from "@/repositories/DefenseScheduleRepository";
import fs from "fs";
import path from "path";

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

  constructor() {
    this.scheduleRepo = new DefenseScheduleRepository();
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

      for (let i = 0; i < dataLines.length; i++) {
        try {
          const line = dataLines[i];
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
            capstone_code: row.capstone_code,
            scheduled_date: scheduledDate,
            start_time: row["Start Time"],
            end_time: row["End Time"],
            scheduler_status: row.status,
            original_idx: parseInt(row.original_idx) || undefined,
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
      const student = member?.student;
      const user = student?.user;

      // Get supervisor and examiner names
      const supervisor1 = schedule.defense_submission.lecturer;
      const examiner1 = schedule.defense_submission.examiner_1;
      const examiner2 = schedule.defense_submission.examiner_2;

      return {
        nim: student?.nim || "-",
        name: user?.name || "-",
        capstone_code: schedule.defense_submission.capstone_code || "-",
        type: schedule.defense_submission.defense_type || "-",
        date: schedule.scheduled_date || "-",
        startTime: schedule.start_time || "-",
        endTime: schedule.end_time || "-",
        spv_1: supervisor1?.user?.name || "-",
        spv_2: "-", // Currently no spv_2 in DefenseSubmission entity
        examiner_1: examiner1?.user?.name || "-",
        examiner_2: examiner2?.user?.name || "-",
        status: schedule.status || "-",
        location: schedule.room || "Prodi",
      };
    });
  }
}
